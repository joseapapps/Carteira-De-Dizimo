
import { GoogleGenAI } from "@google/genai";
import { Transaction } from "../types";

export const getFinancialAdvice = async (transactions: Transaction[]): Promise<string> => {
  if (transactions.length === 0) return "Adicione algumas transações para receber conselhos financeiros personalizados!";

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const total = transactions.reduce((acc, t) => acc + t.amount, 0);
  const recent = transactions.slice(-5).map(t => `${t.description}: R$${t.amount.toFixed(2)}`).join(", ");

  const prompt = `
    Como um consultor financeiro especialista e amigável, analise estas transações recentes: ${recent}.
    O saldo total bruto recebido até agora é R$${total.toFixed(2)}.
    Lembre-se que o usuário separa 10% para o dízimo.
    Dê uma dica curta, criativa e motivadora (máximo 3 frases) em português sobre prosperidade ou gestão financeira.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Continue focado nos seus objetivos financeiros!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Mantenha a consistência em seus lançamentos para prosperar!";
  }
};
