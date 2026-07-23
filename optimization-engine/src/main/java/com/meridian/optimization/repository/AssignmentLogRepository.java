package com.meridian.optimization.repository;

import com.meridian.optimization.entity.AssignmentLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface AssignmentLogRepository extends JpaRepository<AssignmentLog, UUID> {
}
