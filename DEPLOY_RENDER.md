# Publicar na Render com banco gratuito

1. Crie um projeto no [Neon](https://neon.com/) e escolha o plano Free. Copie a connection string PostgreSQL; mantenha-a privada.
2. No Render, crie **New + > Blueprint** e conecte o repositório `Edukkyo/kazoku-kadojo`.
3. Revise o Blueprint: ele cria somente o serviço web `kazoku-dojo`, no plano gratuito. O serviço pode dormir após 15 minutos sem tráfego e levar cerca de um minuto para voltar.
4. No serviço Render, abra **Environment** e configure `DATABASE_URL` com a connection string do Neon. O app não inicia no Render sem essa variável, para evitar o uso acidental de SQLite efêmero.
5. Aguarde o deploy e teste a URL `onrender.com`.
6. No serviço, acesse **Settings > Custom Domains** e adicione:
   - `kazokukadojo.com.br`
   - `www.kazokukadojo.com.br`
7. Configure no provedor do domínio exatamente os registros DNS apresentados pelo Render.
8. Aguarde a propagação do DNS e a emissão automática do certificado HTTPS.

O app usa SQLite localmente e PostgreSQL quando configurado. As contas locais existentes em `kazoku.db` não são migradas automaticamente para o Neon. O arquivo local permanece fora do repositório.

O plano Free do Neon não exige cartão, inclui 1 GB de armazenamento por projeto e suspende o banco quando ocioso. O Render Free também pode suspender o site. Confira os limites atuais antes de usar em produção.

O `KAZOKU_SECRET_KEY` é gerado pelo Blueprint. Não compartilhe essa chave, a `DATABASE_URL` ou arquivos de banco com contas reais. Fotos enviadas para eventos ficam no disco efêmero do Render Free e podem desaparecer em reinícios e deploys.
