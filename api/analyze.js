export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { analysisType, contractType, contractValue, urgency, contractText } = req.body;

    const instructions = {
        completa: `ANÁLISE COMPLETA em 7 seções:
1. **RESUMO EXECUTIVO** - Risco (🟢Baixo/🟡Médio/🔴Alto/⚫Crítico), partes, objeto, valor, prazo
2. **ANÁLISE POR CLÁUSULA** - Cada cláusula: resumo, risco, recomendação
3. **CHECKLIST COMPLIANCE** - LGPD, Trabalhista, Tributário, PI
4. **MAPA DE RISCOS** - Tabela: Cláusula|Risco|Probabilidade|Impacto|Mitigação
5. **PONTOS DE NEGOCIAÇÃO** - Cláusulas a negociar com redação alternativa
6. **PARECER FINAL** - ASSINAR/RESSALVAS/NÃO ASSINAR com justificativa
7. **DOCUMENTOS COMPLEMENTARES**`,
        rapida: `ANÁLISE EXPRESSA:
## ⚡ RISCO GERAL: [🟢Baixo/🟡Médio/🔴Alto/⚫Crítico]
## ✅ 5 PONTOS POSITIVOS
## ❌ 5 PONTOS CRÍTICOS  
## 📝 3 AÇÕES IMEDIATAS
## 🎯 RECOMENDAÇÃO: [ASSINAR/NEGOCIAR/REJEITAR]`,
        clausula: `REVISÃO DE CLÁUSULAS CRÍTICAS:
Para cada cláusula importante:
1. Texto original (resumo)
2. Análise de risco
3. Problemas identificados
4. **REDAÇÃO ALTERNATIVA** favorável à XD4Solutions
5. Argumentos para negociação
Foco: rescisão, penalidades, responsabilidades, confidencialidade, PI`,
        comparar: `BENCHMARK vs MELHORES PRÁTICAS (Pinheiro Neto, Mattos Filho):
## 📊 SCORE: X/100
## 🔍 GAPS VS MERCADO
## ❌ CLÁUSULAS AUSENTES
## ⚠️ CLÁUSULAS ABAIXO DO PADRÃO
## ✅ SUGESTÕES DE MELHORIA
## 📝 VERSÕES OTIMIZADAS das 3 principais cláusulas`,
        checklist: `CHECKLIST DUE DILIGENCE:
## 📋 DOCUMENTOS A SOLICITAR - [ ] cada item
## 🔍 VERIFICAÇÕES - [ ] cada item
## 🚩 RED FLAGS IDENTIFICADOS
## ✅ ITENS OBRIGATÓRIOS
## 📝 ALTERAÇÕES NECESSÁRIAS
## ⚠️ RISCOS ESPECÍFICOS`
    };

    const systemPrompt = `Você é Consultor Jurídico Sênior da XD4Solutions, especialista em Direito Empresarial e Contratual.
Missão: proteger juridicamente a XD4Solutions, garantir conformidade com legislação brasileira, identificar riscos.
Use markdown, emojis de risco (🟢🟡🔴⚫), sugira redações alternativas quando necessário.`;

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-opus-4-20250514',
                max_tokens: 8000,
                system: systemPrompt,
                messages: [{ role: 'user', content: `${instructions[analysisType]}\\n\\nTipo: ${contractType}\\nValor: ${contractValue||'N/I'}\\nUrgência: ${urgency||'Normal'}\\n\\nCONTRATO:\\n${contractText}` }]
            })
        });

        if (!response.ok) throw new Error(await response.text());
        const data = await response.json();
        return res.status(200).json({ analysis: data.content[0].text });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: 'Erro na análise' });
    }
}
