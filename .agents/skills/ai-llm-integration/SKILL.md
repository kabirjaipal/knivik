---
name: ai-llm-integration
description: Guidelines and best practices for production-grade LLM integrations, covering structured outputs, rate-limiting handlers, exponential backoff retries, and cost tracking.
version: 1.0.0
author: LLM Integration Best Practices
tags:
  - ai
  - llm
  - api
  - resilience
  - zod
---

# Skill: Reliable LLM Integration & Cost Optimization Playbook

This playbook outlines official guidelines and resilience strategies for integrating LLM APIs (OpenAI, Anthropic, Gemini, Groq) into production applications.

---

## 🚀 When to Activate

Trigger this skill automatically whenever you are:
1. Writing or modifying code that interacts with LLM providers or AI models.
2. Structuring prompt designs, system instructions, or few-shot examples.
3. Parsing LLM responses, running schema validations, or handling JSON extraction.
4. Setting up rate limits, timeout logic, API retry patterns, or gateway configurations.

---

## 💎 1. Structured Outputs & Validation

To prevent malformed LLM responses from causing application errors:
*   **Use Native Structured Features:** Leverage provider-specific tools like OpenAI’s `response_format` (JSON Schema) or Google Gemini’s structured output configuration to enforce response syntax at the model level.
*   **Schema Enforcement:** Define expected outputs using validation libraries (e.g. Zod in TypeScript, Pydantic in Python) and parse LLM outputs directly into structured models.
*   **Defense in Depth:** Always run application-level semantic validation after parsing. Do not assume syntax-valid JSON contains logic-valid data.
*   **Graceful Fallbacks:** Implement default structures for optional fields, and keep a backup model ready if primary parsing fails.

---

## ⚡ 2. Rate Limits & Exponential Backoff

LLM APIs enforce strict Requests-Per-Minute (RPM) and Tokens-Per-Minute (TPM) limits:
*   **Exponential Backoff with Jitter:** When an API returns a `429 Too Many Requests` error, do not retry immediately. Increase the delay between retries exponentially and add a random delay (jitter) to prevent concurrent client retries.
*   **Transient Error Gating:** Implement retries *only* for transient errors:
    *   **Retry:** `429` (Rate limit), `500`/`502`/`503`/`504` (Server timeouts/outages).
    *   **Do Not Retry:** `400` (Bad request/validation errors) or `401` (Authentication errors).
*   **Circuit Breakers:** Limit maximum retries (typically 3 to 5). If requests fail repeatedly, trip the circuit breaker and fail gracefully to avoid wasting tokens.

---

## 💰 3. Cost Tracking & Prompt Optimization

*   **Caching:** Store responses for common or repetitive queries (e.g., in Redis keyed by prompt hash) to avoid redundant LLM calls and reduce billing.
*   **Model Routing:** Dynamically route simple tasks (like token sorting, categorization) to faster, cheaper models (e.g., GPT-4o-mini, Claude Haiku) and reserve advanced models for reasoning tasks.
*   **Context Compression:**
    *   Keep system prompts clear, concise, and structured.
    *   Summarize conversation histories rather than feeding full historical logs.
    *   Avoid bloated few-shot examples.
*   **Tracing & Monitoring:** Route all LLM requests through an observability proxy or logging middleware to capture token usage, latency, and costs per query.
