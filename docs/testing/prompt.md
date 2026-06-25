# skelica — Test Prompt

Use este prompt para validar se todos os componentes estão sendo detectados e destacados corretamente.

## Prompt de Teste Completo

```
You are a senior Python developer with 10 years of experience in data engineering and machine learning. Your expertise includes building scalable data pipelines and optimizing ML models for production.

Given that we're building a real-time recommendation system for an e-commerce platform with 1 million daily active users, you need to design a solution that handles high throughput and low latency requirements.

Your task is to write a Python function that processes user interaction data and generates personalized product recommendations. The function should accept a user_id and return a ranked list of product IDs with confidence scores.

Do not use external recommendation libraries like Surprise or LightFM. Limit the response to 100 lines of code. Do not include any database connection code.

Example input: user_id = "user_12345"
Example output: {"recommendations": [{"product_id": "prod_001", "score": 0.95}, {"product_id": "prod_002", "score": 0.87}]}

Output the result as a valid JSON object with the following structure:
{
  "function_name": "string",
  "code": "string containing the full Python code",
  "complexity": "O(n) notation",
  "dependencies": ["list of required packages"]
}
```

## Componentes Esperados

| Componente | Cor | Trecho Esperado |
|------------|-----|-----------------|
| **Role** | 🔵 Azul | "You are a senior Python developer..." |
| **Context** | 🟣 Violeta | "Given that we're building..." |
| **Instruction** | 🟠 Laranja | "Your task is to write..." |
| **Constraint** | 🔴 Vermelho | "Do not use external..." / "Limit the response..." |
| **Example** | 🟢 Verde | "Example input: user_id..." |
| **Format** | 🔵 Cyan | "Output the result as a valid JSON..." |

## Prompt de Teste Simples

Para teste rápido:

```
You are a data analyst. Given that the dataset contains sales data from 2023, analyze the monthly trends. Your task is to create a summary report. Do not include raw data in the output. Example: "January: $50k revenue". Output as markdown table.
```

## Como Validar

1. Cole o prompt no textarea
2. Clique em **Analyze**
3. Verifique se cada trecho aparece com a cor correta
4. O score deve ser alto (>70%) pois o prompt é completo
