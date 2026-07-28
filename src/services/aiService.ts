import { apiClient } from './apiClient';
import type {
  AiProcessingRequestDto,
  AiProcessingResultDto,
  ImageTransactionResponseDto,
} from '../types/api';

export interface VoiceTranscriptionResponse {
  text: string;
  confidence: number;
}

export interface ImageExtractionResponse {
  extractedText: string;
  confidence: number;
}

export interface TransactionFromAiRequest {
  walletId: string;
  mockTranscribedText?: string;
  mockExtractedText?: string;
}

// ============ VOICE AI ============
export const voiceAiService = {
  // POST /api/ai/voices/transcriptions
  // Transcribe voice file to text
  transcribe: async (voiceFile: File): Promise<VoiceTranscriptionResponse> => {
    const formData = new FormData();
    formData.append('Voice', voiceFile);

    const response = await apiClient.post<VoiceTranscriptionResponse>(
      '/api/ai/voices/transcriptions',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  // POST /api/ai/voices/transactions
  // Create transaction from voice input
  createTransaction: async (walletId: string, voiceFile: File, mockText?: string): Promise<AiProcessingResultDto> => {
    const formData = new FormData();
    formData.append('Voice', voiceFile);
    formData.append('WalletId', walletId);
    if (mockText) {
      formData.append('MockTranscribedText', mockText);
    }

    const response = await apiClient.post<AiProcessingResultDto>(
      '/api/ai/voices/transactions',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },
};

// ============ IMAGE AI ============
export const imageAiService = {
  // POST /api/ai/images/extract-text
  // Extract text from image (OCR)
  extractText: async (imageFile: File, mockText?: string): Promise<ImageExtractionResponse> => {
    const formData = new FormData();
    formData.append('Image', imageFile);
    if (mockText) {
      formData.append('MockExtractedText', mockText);
    }

    const response = await apiClient.post<ImageExtractionResponse>(
      '/api/ai/images/extract-text',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  // POST /api/ai/images/ocr
  // Alias for extract-text
  ocr: async (imageFile: File, mockText?: string): Promise<ImageExtractionResponse> => {
    const formData = new FormData();
    formData.append('Image', imageFile);
    if (mockText) {
      formData.append('MockExtractedText', mockText);
    }

    const response = await apiClient.post<ImageExtractionResponse>(
      '/api/ai/images/ocr',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  // POST /api/ai/images/transactions
  // Create transaction from receipt image
  createTransaction: async (walletId: string, imageFile: File, mockText?: string): Promise<ImageTransactionResponseDto> => {
    const formData = new FormData();
    formData.append('Image', imageFile);
    formData.append('WalletId', walletId);
    if (mockText) {
      formData.append('MockExtractedText', mockText);
    }

    const response = await apiClient.post<ImageTransactionResponseDto>(
      '/api/ai/images/transactions',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    // AI service historically exposed `transactionType` while the Finance REST
    // contract uses `type`. Normalize both versions here so draft edit/confirm
    // always sends the required transaction type.
    return {
      ...response.data,
      createdTransactions: response.data.createdTransactions.map((item) => {
        const transaction = item.transaction as typeof item.transaction & {
          transactionType?: string;
        };
        return {
          ...item,
          transaction: {
            ...transaction,
            type: transaction.type || transaction.transactionType || item.tag.transactionType,
          },
        };
      }),
    };
  },
};

// ============ AI PROCESSING REQUESTS & RESULTS ============
// BE returns AiProcessingRequest array directly
export const aiProcessingService = {
  // GET /api/ai/requests - Returns array directly
  getRequests: async (): Promise<AiProcessingRequestDto[]> => {
    const response = await apiClient.get<AiProcessingRequestDto[]>('/api/ai/requests');
    return response.data;
  },

  // GET /api/ai/requests/{id}
  getRequestById: async (id: string): Promise<AiProcessingRequestDto | null> => {
    const response = await apiClient.get<AiProcessingRequestDto>(`/api/ai/requests/${id}`);
    return response.data;
  },

  // GET /api/ai/results/{requestId}
  getResult: async (requestId: string): Promise<AiProcessingResultDto | null> => {
    const response = await apiClient.get<AiProcessingResultDto>(`/api/ai/results/${requestId}`);
    return response.data;
  },
};

export default {
  voiceAiService,
  imageAiService,
  aiProcessingService,
};
