package com.knoweb.HRM.utility;

import com.knoweb.HRM.model.Company;
import com.knoweb.HRM.model.Employee;
import com.knoweb.HRM.model.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Component
public class JwtTokenUtil {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private long expiration;

    public String generateToken(User user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", user.getRole());
        return createToken(claims, user.getUsername());
    }

    public String generateToken(Company company) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("Role", company.getRole());
        return createToken(claims, company.getUsername());
    }


    public String generateToken(Employee employee) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("Role", employee.getRole());
        return createToken(claims, employee.getUsername());


    }

    private String createToken(Map<String, Object> claims, String subject) {
        return Jwts.builder().setClaims(claims).setSubject(subject).setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(SignatureAlgorithm.HS512, secret).compact();
    }

//    public Boolean validateToken(String token, UserDetails userDetails) {
//        final String username = extractUsername(token);
//        final String role = extractRole(token);
//        return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
//    }

    public Boolean validateToken(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        final String Role = extractRole(token);
        return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }

    private String extractReg_no(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public String extractRole(String token) {
        return extractClaim(token, claims -> (String) claims.get("Role"));
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser().setSigningKey(secret).parseClaimsJws(token).getBody();
    }

    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }
}

