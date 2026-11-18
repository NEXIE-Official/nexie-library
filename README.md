# N·EXIE LIBRARY

**Creative Archive & Management Platform** — interface web responsiva com empacotamento Android via Capacitor.

## Executar localmente

Requer Node.js 22+.

- `npm install`
- `npm run dev`
- `npm run build`

## Gerar APK Android

No GitHub, abra **Actions → Build Android APK → Run workflow**. Ao terminar, baixe o artefato `nexie-library-debug-apk` na execução do workflow. O artefato é um APK debug para testes, não uma versão de distribuição assinada.

## Funcionalidades desta primeira versão

- Painel com indicadores e pipeline de trabalhos.
- Cadastro, edição, atribuição, prioridade, prazo, status e exclusão de trabalhos.
- Diretório de colaboradores e equipes N·EXIE / Gatherverse.
- Roster de artistas A.X.S.
- Central de suporte que prepara e-mail para nexie.development@outlook.com.
- Layout responsivo e armazenamento local no dispositivo.

## Limites antes de produção

Esta entrega é uma **versão funcional inicial / demonstração local**. Os dados ficam no navegador/dispositivo; ainda não existe servidor, banco compartilhado, login real, SSO, autorização por função, sincronização entre usuários, upload seguro de arquivos nem criptografia ponta a ponta. Não use dados confidenciais nesta versão. Para ativar esses recursos é necessário implantar backend, provedor de identidade (OIDC/SAML), política de acesso, armazenamento e serviço de e-mail. Nunca coloque segredos no frontend ou no APK.

O roster inicial usa os nomes e cargos fornecidos no planejamento do projeto.
