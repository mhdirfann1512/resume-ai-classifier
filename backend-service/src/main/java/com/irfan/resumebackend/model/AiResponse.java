package com.irfan.resumebackend.model;

import lombok.Data;
import java.util.List;

@Data
public class AiResponse {
    private Prediction top_prediction;
    private List<Prediction> all_predictions;

    @Data
    public static class Prediction {
        private String department;
        private double confidence;
    }
}