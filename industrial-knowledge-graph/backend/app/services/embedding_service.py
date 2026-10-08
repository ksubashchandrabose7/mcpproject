from sentence_transformers import SentenceTransformer
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import json

MODEL_NAME = 'sentence-transformers/all-MiniLM-L6-v2'

class EmbeddingService:
    _instance = None
    _model = None
    
    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance
    
    def __init__(self):
        try:
            # Try loading cached local files first to prevent network delay
            self._model = SentenceTransformer(MODEL_NAME, local_files_only=True)
        except Exception:
            try:
                self._model = SentenceTransformer(MODEL_NAME)
            except Exception as e:
                print(f"Warning: Could not load embedding model: {e}")
                self._model = None
    
    def encode(self, texts: list[str]) -> list[list[float]]:
        if self._model is None:
            return []
        try:
            embeddings = self._model.encode(texts, convert_to_numpy=True)
            return embeddings.tolist()
        except Exception as e:
            print(f"Encoding error: {e}")
            return []
    
    def encode_single(self, text: str) -> list[float]:
        res = self.encode([text])
        return res[0] if res else []
    
    def search_similar(self, query_embedding: list[float], chunk_embeddings: list[list[float]], top_k: int = 5) -> list[tuple[int, float]]:
        """Return list of (index, similarity_score) sorted by similarity descending"""
        if not chunk_embeddings or not query_embedding:
            return []
        try:
            query_np = np.array([query_embedding])
            chunks_np = np.array(chunk_embeddings)
            scores = cosine_similarity(query_np, chunks_np)[0]
            top_indices = np.argsort(scores)[::-1][:top_k]
            return [(int(idx), float(scores[idx])) for idx in top_indices]
        except Exception:
            return []
