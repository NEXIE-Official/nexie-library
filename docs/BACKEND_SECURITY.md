# Backend e segurança — N·EXIE LIBRARY

## Estado real
O repositório contém uma prévia frontend e uma migração PostgreSQL/Supabase com Row Level Security. **O backend ainda não está provisionado nem conectado**: não há projeto Supabase, domínio de autenticação, credenciais, usuários autenticados ou entrega de e-mail configurados. O seletor de perfil da prévia não é login e não protege dados. Os registros atuais ficam no armazenamento local do navegador.

## Arquitetura-alvo
- Android: Capacitor, consumindo API HTTPS.
- Identidade: Supabase Auth (OIDC), com SSO corporativo a ser conectado ao IdP escolhido pela N·EXIE; MFA obrigatório para administração e tecnologia.
- Dados: PostgreSQL com RLS; autorização no servidor, nunca apenas no frontend.
- Arquivos: bucket privado, URLs assinadas de curta duração, validação MIME/tamanho, antivírus e trilha de auditoria.
- Mensagens e chamados: tabelas privadas e serviço backend de notificação; envio de e-mail pelo servidor usando provedor transacional. Não enviar e-mail diretamente do app nem guardar chaves nele.
- Segredos: variáveis de ambiente do servidor/CI; nunca commitar chaves.

## Migração inicial
Arquivo: `supabase/migrations/202611180001_initial_security.sql`.
Cria perfis, trabalhos, comentários, mensagens diretas e chamados de TI, com políticas RLS iniciais. Revisão de segurança independente é obrigatória antes de produção.

## Próximos passos necessários para ativar produção
1. Criar projeto Supabase sob controle da N·EXIE e definir região, domínio e política de retenção.
2. Escolher o provedor SSO/IdP e configurar OIDC/SAML, MFA, recuperação de conta e convites.
3. Provisionar as contas individualmente após validar identidade e cargo; os nomes da lista não são credenciais.
4. Aplicar a migração, revisar as políticas com testes negativos e configurar backups, logs e alertas.
5. Configurar função server-side para notificar `nexie.development@outlook.com` e atribuir tickets à equipe TI em escala.
6. Conectar o app ao backend por variáveis públicas de URL/chave anon; manter service-role e segredos exclusivamente no servidor.
7. Testar isolamento entre usuários/equipes, upload, sessões, revogação, rate limiting, auditoria e recuperação de desastre.

## Criptografia e controles
HTTPS/TLS em trânsito e criptografia gerenciada em repouso dependem do provedor. A migração não implementa criptografia ponta a ponta. Dados sensíveis exigem classificação, minimização, política de retenção, gestão de chaves e avaliação LGPD. RLS é uma camada de defesa, não substitui testes de autorização e segurança.
