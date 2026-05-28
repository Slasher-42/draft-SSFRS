import axios from "axios";

const aiApi = axios.create({ baseURL: "http://localhost:8083" });

export interface ImageVerificationResult {
  claim_id: string;
  location_status: "VERIFIED" | "MISMATCH" | "UNCERTAIN";
  confidence: "HIGH" | "MEDIUM" | "LOW";
  what_is_visible: string;
  location_indicators: string;
  analysis: string;
  reasoning: string;
}

export const aiService = {
  async verifyImageLocation(
    claimId: string,
    imageUrls: string[],
    constructionLocation: string
  ): Promise<ImageVerificationResult> {
    const res = await aiApi.post<ImageVerificationResult>("/api/ai/geolocation/verify-image", {
      claim_id: claimId,
      image_urls: imageUrls,
      construction_location: constructionLocation,
    });
    return res.data;
  },
};
