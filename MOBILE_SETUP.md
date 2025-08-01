# Configuração Mobile - Agro Rural Login

Esta aplicação agora tem suporte para plataformas móveis com funcionalidade de scanner QR code para resgate de vouchers.

## Preparação para Dispositivo Físico ou Emulador

Para testar a aplicação em um dispositivo móvel real ou emulador, siga estes passos:

### 1. Exportar e Clonar o Projeto
1. Use o botão "Export to Github" para transferir o projeto para seu repositório GitHub
2. Clone o projeto do seu repositório GitHub:
```bash
git clone <seu-repositorio-url>
cd agro-rural-login
```

### 2. Instalar Dependências
```bash
npm install
```

### 3. Adicionar Plataformas
Para Android:
```bash
npx cap add android
```

Para iOS (requer Mac com Xcode):
```bash
npx cap add ios
```

### 4. Atualizar Dependências Nativas
```bash
# Para Android
npx cap update android

# Para iOS
npx cap update ios
```

### 5. Build da Aplicação
```bash
npm run build
```

### 6. Sincronizar com Plataformas Nativas
```bash
npx cap sync
```

### 7. Executar na Plataforma Desejada
Para Android:
```bash
npx cap run android
```

Para iOS:
```bash
npx cap run ios
```

## Funcionalidades Mobile

### Scanner QR Code
- **Localização**: Dashboard do Agrodealer
- **Botão**: "Escanear QR" (aparece apenas em dispositivos móveis)
- **Funcionalidade**: Permite escanear QR codes de vouchers diretamente com a câmera
- **Permissões**: Solicita automaticamente permissão de câmera

### Permissões Necessárias
A aplicação solicita as seguintes permissões:
- **Câmera**: Para scanner QR code de vouchers

## Desenvolvimento Contínuo

Após fazer alterações no código:
1. Execute `git pull` para obter as últimas alterações
2. Execute `npx cap sync` para sincronizar com as plataformas nativas
3. Execute novamente o app com `npx cap run android` ou `npx cap run ios`

## Resolução de Problemas

### Scanner QR não funciona
- Verifique se as permissões de câmera foram concedidas
- Certifique-se de estar testando em um dispositivo físico (não funciona no navegador)

### Erros de build
- Execute `npm run build` antes de `npx cap sync`
- Verifique se todas as dependências foram instaladas corretamente

## URLs de Desenvolvimento
- **Preview URL**: https://89032615-ac76-445f-8a00-efd8599ca876.lovableproject.com?forceHideBadge=true
- **Hot Reload**: Habilitado automaticamente durante desenvolvimento