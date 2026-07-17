package com.example.server.me;

import com.example.server.me.dto.MyStats;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.UUID;

@Mapper
public interface MeStatsMapper {

    MyStats findStats(@Param("userId") UUID userId);
}
