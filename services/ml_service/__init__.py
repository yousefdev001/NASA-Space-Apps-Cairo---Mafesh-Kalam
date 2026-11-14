"""AuraMed ML Service Package."""

from services.ml_service.model_runner import MLModelRunner, runner_instance

__all__ = ["MLModelRunner", "runner_instance"]
