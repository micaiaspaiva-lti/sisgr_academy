import { describe, it, expect } from "vitest";
import { POST } from "./route";

describe("API de Leads - Validação Zod", () => {
  it("deve rejeitar e retornar status 400 para e-mail incorreto", async () => {
    const mockRequest = {
      json: async () => ({
        nome: "Lucas",
        email: "lucas-email-invalido",
        aulaOrigemId: "aula-1-1-introducao",
        notaQuiz: 90
      })
    } as unknown as Request;

    const response = await POST(mockRequest);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.errors).toBeDefined();
  });

  it("deve aceitar dados válidos e retornar status 200", async () => {
    const mockRequest = {
      json: async () => ({
        nome: "Lucas Pereira",
        email: "lucas.pereira@empresa.com",
        aulaOrigemId: "5e022f46-aa43-41bb-a63e-2b5a1b32d164",
        notaQuiz: 100,
        respostasQuiz: []
      })
    } as unknown as Request;

    const response = await POST(mockRequest);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.lead).toBeDefined();
  });
});
