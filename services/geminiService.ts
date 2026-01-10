import { GoogleGenAI } from "@google/genai";
import { Transaction } from "../types";

export const getFinancialAdvice = async (transactions: Transaction[]): Promise<string> => {
  if (transactions.length === 0) return "Comece a registrar seus ganhos para que eu possa orientar sua jornada rumo à prosperidade!";

  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    return "Conselho do dia: A constância no registro é o primeiro passo para a liberdade financeira. Continue lançando seus ganhos!";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const total = transactions.reduce((acc, t) => acc + t.amount, 0);
    const recent = transactions.slice(-5).map(t => `${t.description}: R$${t.amount.toFixed(2)}`).join(", ");

    const prompt = `
      Como um consultor financeiro focado em prosperidade e princípios de gratidão (dízimo), analise estas transações: ${recent}.
      O total acumulado é R$${total.toFixed(2)}.
      O usuário separa 10% para o dízimo fielmente.
      Dê uma dica curta, inspiradora e prática (máximo 2 frases) sobre como multiplicar esses recursos ou manter a sabedoria financeira.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    return response.text || "Sua jornada de prosperidade está apenas começando. Mantenha o foco!";
  } catch (error) {
    console.warn("AI Service unavailable, using fallback advice.");
    return "Sabedoria do dia: Quem é fiel no pouco, sobre o muito será colocado. Continue gerindo bem seus recursos!";
  }
};