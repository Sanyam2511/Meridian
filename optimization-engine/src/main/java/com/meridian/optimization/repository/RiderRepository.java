package com.meridian.optimization.repository;

import com.meridian.optimization.entity.Rider;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.meridian.optimization.entity.RiderStatus;

import java.util.List;
import java.util.UUID;

@Repository
public interface RiderRepository extends JpaRepository<Rider, UUID> {
    List<Rider> findByCurrentStatus(RiderStatus status);
}
