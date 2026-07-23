package com.meridian.optimization.repository;

import com.meridian.optimization.entity.Rider;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface RiderRepository extends JpaRepository<Rider, UUID> {
}
