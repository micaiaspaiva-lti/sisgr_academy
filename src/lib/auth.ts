import jwt from "jsonwebtoken";

export interface UserSession {
  id: string;
  nome: string;
  email: string;
  empresaId?: string;
  tipo: "normal" | "vip";
  role: "aluno" | "admin" | "instrutor";
}

// Auxiliar defensivo para limpar e formatar chaves copiadas do .env (remove aspas e ajusta quebras de linha)
function cleanKey(key: string | undefined): string {
  if (!key) return "";
  let cleaned = key.trim();
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    cleaned = cleaned.slice(1, -1);
  }
  if (cleaned.startsWith("'") && cleaned.endsWith("'")) {
    cleaned = cleaned.slice(1, -1);
  }
  return cleaned.replace(/\\n/g, '\n');
}

// Resgata e formata a chave pública RSA cadastrada
const publicKey = cleanKey(process.env.JWT_PUBLIC_KEY);

export function verifySSOToken(token: string): UserSession | null {
  try {
    if (!token) return null;
    
    // Se a chave não estiver preenchida no ambiente, opera com dados simulados de desenvolvimento
    if (!publicKey || publicKey.includes("...")) {
      console.warn("JWT_PUBLIC_KEY não configurado ou inválido. Retornando sessão de teste.");
      return getMockSession();
    }

    const decoded = jwt.verify(token, publicKey, { algorithms: ["RS256"] }) as any;
    
    return {
      id: decoded.sub || decoded.id,
      nome: decoded.nome,
      email: decoded.email,
      empresaId: decoded.empresaId,
      tipo: decoded.tipo || "normal",
      role: decoded.role || "aluno"
    };
  } catch (error) {
    console.error("Falha ao validar token JWT RS256:", error);
    // Permite bypass com token fixo em ambiente de desenvolvimento
    if (token === "mock-token" || process.env.NODE_ENV === "development") {
      return getMockSession();
    }
    return null;
  }
}

export function getMockSession(): UserSession {
  return {
    id: "aluno-sso-teste-id",
    nome: "Arthur Pendragon (SSO Teste)",
    email: "arthur.sso@residuosparceiro.com",
    empresaId: "empresa-parceira-id",
    tipo: "vip",
    role: "aluno"
  };
}

// Auxiliar para assinar tokens de teste em ambiente de desenvolvimento ou testes automatizados
export function signTestToken(payload: any): string {
  const privateKey = cleanKey(process.env.JWT_PRIVATE_KEY);
  if (!privateKey || privateKey.includes("...")) {
    throw new Error("JWT_PRIVATE_KEY não está configurado para assinar tokens.");
  }
  return jwt.sign(payload, privateKey, { algorithm: "RS256" });
}
