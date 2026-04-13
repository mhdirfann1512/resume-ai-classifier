@Entity
@Table(name = "resumes")
@Data
public class Resume {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String fileName;
    
    @Column(columnDefinition = "TEXT") // Important: Resumes are long!
    private String extractedText;

    private String predictedDepartment;
    private Double confidenceScore;
    private LocalDateTime uploadedAt;
}