package com.knoweb.HRM.service;

import com.knoweb.HRM.model.Allowance;
import com.knoweb.HRM.model.Bonus;
import com.knoweb.HRM.repository.AllowanceRepository;
import com.knoweb.HRM.repository.BonusRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class BonusService {

    @Autowired
    private BonusRepository bonusRepository;

    public Bonus createBonus(Bonus bonus) {
        return bonusRepository.save(bonus);
    }


    public List<Bonus> getBonusByCompanyId(long cmpId) {
        return bonusRepository.findByCmpId(cmpId);
    }

    public Bonus updateBonus(Bonus bonus) {
        // Verify the bonus exists
        Optional<Bonus> existingBonus = bonusRepository.findById(bonus.getId());
        if (!existingBonus.isPresent()) {
            throw new RuntimeException("Bonus not found with id: " + bonus.getId());
        }
        
        return bonusRepository.save(bonus);
    }

    public boolean deleteBonus(Long id) {
        if (!bonusRepository.existsById(id)) {
            return false;
        }
        bonusRepository.deleteById(id);
        return true;
    }
}
