package com.matching.platform.mapper;

import com.matching.platform.entity.MatchReport;

public interface MatchReportMapper {

    MatchReport findByMatchId(String matchId);

    int upsert(MatchReport row);
}
