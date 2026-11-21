# Publicar na Render

1. Envie o conteúdo desta pasta para a raiz de um repositório no GitHub.
2. No Render, crie **New + > Blueprint** e conecte o repositório.
3. Revise os recursos definidos em `render.yaml` antes de confirmar:
   - Serviço web `kazoku-dojo`, no plano gratuito. Ele pode entrar em suspensão após inatividade e demorar para responder ao primeiro acesso.
   - PostgreSQL `kazoku-dojo-db`, no plano pago `0.1c-256mb`, com 1 GB de armazenamento. O Render cobra pelo banco; confira o valor atual no dashboard antes de aprovar.
4. Aguarde o primeiro deploy e teste a URL `onrender.com`.
5. No serviço, acesse **Settings > Custom Domains** e adicione:
   - `kazokukadojo.com.br`
   - `www.kazokukadojo.com.br`
6. Configure no provedor do domínio exatamente os registros DNS apresentados pelo Render.
7. Aguarde a propagação do DNS e a emissão automática do certificado HTTPS.

O app usa SQLite localmente e PostgreSQL quando o Render fornece `DATABASE_URL`. As contas locais existentes em `kazoku.db` não são migradas automaticamente para o banco remoto. O arquivo do banco local deve permanecer fora do repositório.

O `KAZOKU_SECRET_KEY` é gerado pelo Blueprint e não deve ser compartilhado. Não publique arquivos de banco de dados com contas reais.

As fotos enviadas para eventos ficam no disco local do serviço e não são persistentes no plano gratuito do Render. Para mantê-las após reinícios e deploys, configure armazenamento persistente ou armazenamento de objetos antes de usar esse recurso em produção.
