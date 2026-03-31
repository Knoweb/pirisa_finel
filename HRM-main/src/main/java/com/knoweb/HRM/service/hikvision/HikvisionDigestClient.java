package com.knoweb.HRM.service.hikvision;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.knoweb.HRM.config.HikvisionSyncProperties;
import org.apache.commons.codec.binary.Hex;
import org.springframework.stereotype.Component;

import javax.net.ssl.HostnameVerifier;
import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.security.cert.X509Certificate;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Component
public class HikvisionDigestClient {

    private final HikvisionSyncProperties properties;
    private final ObjectMapper objectMapper;

    public HikvisionDigestClient(HikvisionSyncProperties properties, ObjectMapper objectMapper) {
        this.properties = properties;
        this.objectMapper = objectMapper;
    }

    public JsonNode postJson(String path, JsonNode body) throws IOException {
        return sendJson("POST", path, body);
    }

    public JsonNode putJson(String path, JsonNode body) throws IOException {
        return sendJson("PUT", path, body);
    }

    private JsonNode sendJson(String method, String path, JsonNode body) throws IOException {
        String requestBody = objectMapper.writeValueAsString(body);
        URI uri = URI.create(normalizeBaseUrl() + path);
        
        // Correct Content-Type for JSON payloads
        String contentType = "application/json; charset=UTF-8";

        HttpURLConnection unauthorized = openConnection(uri.toURL(), method);
        unauthorized.setRequestProperty("Content-Type", contentType);
        unauthorized.setRequestProperty("Accept", "application/json");
        unauthorized.setDoOutput(true);
        writeRequestBody(unauthorized, requestBody);

        int status = unauthorized.getResponseCode();
        if (status != HttpURLConnection.HTTP_UNAUTHORIZED) {
            return parseResponseBody(readResponseBody(unauthorized));
        }

        String wwwAuthenticate = unauthorized.getHeaderField("WWW-Authenticate");
        if (wwwAuthenticate == null || !wwwAuthenticate.startsWith("Digest ")) {
            throw new IOException("Hikvision digest challenge not received");
        }

        Map<String, String> challenge = parseDigestChallenge(wwwAuthenticate.substring(7));
        unauthorized.disconnect();

        HttpURLConnection authorized = openConnection(uri.toURL(), method);
        authorized.setRequestProperty("Content-Type", contentType);
        authorized.setRequestProperty("Accept", "application/json");
        authorized.setRequestProperty("Authorization", buildDigestHeader(challenge, uri, method));
        authorized.setDoOutput(true);
        writeRequestBody(authorized, requestBody);

        int authorizedStatus = authorized.getResponseCode();
        if (authorizedStatus < 200 || authorizedStatus >= 300) {
            String errorBody = readResponseBody(authorized);
            throw new IOException("Hikvision API request failed with status " + authorizedStatus + " body: " + errorBody);
        }

        return parseResponseBody(readResponseBody(authorized));
    }

    private String normalizeBaseUrl() {
        if (properties.getBaseUrl() == null || properties.getBaseUrl().isBlank()) {
            throw new IllegalStateException("hikvision.sync.base-url is required");
        }
        return properties.getBaseUrl().endsWith("/") ?
                properties.getBaseUrl().substring(0, properties.getBaseUrl().length() - 1) :
                properties.getBaseUrl();
    }

    private HttpURLConnection openConnection(URL url, String method) throws IOException {
        if (properties.isTrustSelfSigned() && "https".equalsIgnoreCase(url.getProtocol())) {
            trustAllCertificates();
        }
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        connection.setRequestMethod(method);
        connection.setConnectTimeout(10000);
        connection.setReadTimeout(10000);
        connection.setUseCaches(false);
        connection.setDoInput(true);
        return connection;
    }

    private synchronized void trustAllCertificates() {
        try {
            TrustManager[] trustAll = new TrustManager[]{
                    new X509TrustManager() {
                        @Override
                        public void checkClientTrusted(X509Certificate[] chain, String authType) {
                        }

                        @Override
                        public void checkServerTrusted(X509Certificate[] chain, String authType) {
                        }

                        @Override
                        public X509Certificate[] getAcceptedIssuers() {
                            return new X509Certificate[0];
                        }
                    }
            };
            SSLContext sslContext = SSLContext.getInstance("TLS");
            sslContext.init(null, trustAll, new SecureRandom());
            HttpsURLConnection.setDefaultSSLSocketFactory(sslContext.getSocketFactory());
            HostnameVerifier permissive = (hostname, session) -> true;
            HttpsURLConnection.setDefaultHostnameVerifier(permissive);
        } catch (Exception ignored) {
        }
    }

    private void writeRequestBody(HttpURLConnection connection, String requestBody) throws IOException {
        try (OutputStream outputStream = connection.getOutputStream()) {
            outputStream.write(requestBody.getBytes(StandardCharsets.UTF_8));
        }
    }

    private String readResponseBody(HttpURLConnection connection) throws IOException {
        InputStream inputStream = connection.getResponseCode() >= 400 ? connection.getErrorStream() : connection.getInputStream();
        if (inputStream == null) {
            return "";
        }
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {
            StringBuilder builder = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                builder.append(line);
            }
            return builder.toString();
        }
    }

    private JsonNode parseResponseBody(String body) throws IOException {
        String trimmed = body == null ? "" : body.trim();
        if (trimmed.startsWith("response(") && trimmed.endsWith(")")) {
            trimmed = trimmed.substring("response(".length(), trimmed.length() - 1);
        }
        return objectMapper.readTree(trimmed);
    }

    private Map<String, String> parseDigestChallenge(String challenge) {
        Map<String, String> result = new HashMap<>();
        for (String part : challenge.split(",")) {
            String[] token = part.trim().split("=", 2);
            if (token.length == 2) {
                result.put(token[0], token[1].replace("\"", "").trim());
            }
        }
        return result;
    }

    private String buildDigestHeader(Map<String, String> challenge, URI uri, String method) throws IOException {
        String realm = challenge.get("realm");
        String nonce = challenge.get("nonce");
        String qop = challenge.getOrDefault("qop", "auth");
        if (qop.contains(",")) {
            qop = qop.split(",")[0].trim();
        }
        String opaque = challenge.get("opaque");
        String algorithm = challenge.getOrDefault("algorithm", "MD5");
        String cnonce = UUID.randomUUID().toString().replace("-", "");
        String nc = "00000001";
        String digestUri = uri.getRawPath() + (uri.getRawQuery() != null ? "?" + uri.getRawQuery() : "");

        String ha1 = digest(algorithm, properties.getUsername() + ":" + realm + ":" + properties.getPassword());
        String ha2 = digest(algorithm, method + ":" + digestUri);
        String response = digest(algorithm, ha1 + ":" + nonce + ":" + nc + ":" + cnonce + ":" + qop + ":" + ha2);

        StringBuilder header = new StringBuilder("Digest ");
        header.append("username=\"").append(properties.getUsername()).append("\", ");
        header.append("realm=\"").append(realm).append("\", ");
        header.append("nonce=\"").append(nonce).append("\", ");
        header.append("uri=\"").append(digestUri).append("\", ");
        header.append("algorithm=").append(algorithm).append(", ");
        header.append("response=\"").append(response).append("\", ");
        header.append("qop=").append(qop).append(", ");
        header.append("nc=").append(nc).append(", ");
        header.append("cnonce=\"").append(cnonce).append("\"");
        if (opaque != null) {
            header.append(", opaque=\"").append(opaque).append("\"");
        }
        return header.toString();
    }

    private String digest(String algorithm, String value) throws IOException {
        try {
            String normalized = algorithm.replace("-sess", "").replace("-", "");
            MessageDigest messageDigest = MessageDigest.getInstance(normalized);
            byte[] hashed = messageDigest.digest(value.getBytes(StandardCharsets.UTF_8));
            return Hex.encodeHexString(hashed);
        } catch (Exception e) {
            throw new IOException("Failed to build digest header", e);
        }
    }
}
