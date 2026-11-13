# Juventude em Movimento

Site estático em HTML, CSS e JavaScript, com três páginas independentes:

1. `index.html` — apresentação do projeto, dados, cultura e mural de post-its.
2. `funcoes.html` — escolha obrigatória de duas funções para formar a equipe.
3. `jogo.html` — simulação da Vila Esperança com sete desafios, três alternativas por desafio, orçamento, indicadores, consequências, revelação final e Mural da Sociedade.

## Como abrir

A forma recomendada é abrir a pasta no VS Code e iniciar o **Live Server** na raiz do projeto. Também funciona com um servidor local simples:

```bash
python -m http.server 8000
```

Depois, abra `http://localhost:8000` no navegador. Não abra apenas os arquivos CSS ou JS isoladamente: comece em `index.html`.

## Funcionalidades incluídas

- Navegação entre páginas reais (não é uma página única com seções simuladas).
- Alternância de tema claro/escuro na home, com preferência salva.
- Textos do projeto sobre cultura periférica, revista do Oziel e dados de IPEA, Oxfam e UNICEF; os cartões de dados têm áreas expansíveis com o contexto completo.
- Mural inicial com mensagens temáticas sobre valorização cultural, artistas locais, identidade e participação comunitária.
- Mural de post-its com nome, texto e cor; validação, salvamento local e botão de exclusão dos post-its criados no próprio navegador.
- Seleção de exatamente duas funções; cada função inicia a partida com um bônus de indicador.
- Sete desafios com três escolhas em cada um.
- Orçamento inicial fictício de R$ 100.000; opções acima do orçamento ficam desabilitadas e o saldo nunca fica negativo.
- Indicadores de qualidade de vida, educação, infraestrutura, cultura e lazer, saneamento, saúde e emprego/renda, limitados a 0–100.
- Cartões de consequência com resultado imediato, impacto nos moradores, ponto de atenção, mudanças nos indicadores e reflexão.
- Algumas decisões deixam consequências para desafios posteriores.
- Progresso da partida salvo no `localStorage`, inclusive se o navegador for recarregado após uma escolha.
- Revelação final e mural com publicações, data, hora, curtidas e exclusão das publicações criadas pelo próprio navegador.
- Textos inseridos no DOM com `textContent`, limites de caracteres e validação básica para evitar execução de HTML enviado em publicações.
- Layout responsivo para desktop, tablet e celular.

## Persistência do mural entre visitantes (Supabase opcional)

Sem configuração adicional, os post-its e publicações ficam salvos no navegador em que foram criados. Para diferentes visitantes verem as mesmas publicações, conecte um projeto Supabase:

1. Crie um projeto gratuito no Supabase.
2. No painel do projeto, abra **SQL Editor** e execute o arquivo `supabase/schema.sql`. Se já tiver configurado o mural antes, execute novamente o arquivo atualizado para adicionar a coluna de propriedade e a função de exclusão.
3. Abra `js/config.js` e preencha `supabaseUrl` e `supabaseAnonKey` com a URL do projeto e a chave `anon`/`public`.
4. Publique todos os arquivos no mesmo domínio/servidor e teste a criação de um post-it e de uma publicação.

A chave `service_role` não deve ser colocada no front-end. As políticas RLS permitem leitura e inserção pública, mas não permitem apagar ou editar publicações de outras pessoas. Cada navegador recebe um token aleatório para identificar os post-its e publicações que criou; as funções SQL de exclusão só removem um registro quando o token corresponde. O token não é enviado nas leituras públicas. As curtidas usam uma função SQL específica.

> A conexão remota precisa ser configurada com as credenciais do seu próprio projeto Supabase. O site funciona sem elas, usando armazenamento local como alternativa automática.

## Observações de conteúdo

Os dados e textos sobre IPEA, Oxfam e UNICEF foram inseridos a partir do material fornecido para o projeto. Os indicadores, a população e o orçamento da Vila Esperança são fictícios e servem apenas para a dinâmica do jogo.


## Créditos

Projeto desenvolvido por Ana Luyza, Evillyn Fernandes, Gabriela Oliveira, João Gabriel e Maria Luiza.
