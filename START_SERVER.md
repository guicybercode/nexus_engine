# Como Iniciar o Servidor

## Passo a Passo

1. Abra um terminal e navegue até o diretório do projeto:
   ```bash
   cd /home/guicybercode/Documents/gui_things/project_elixir_rust_lua/elixir_backend
   ```

2. Inicie o servidor:
   ```bash
   mix phx.server
   ```

3. Aguarde até ver a mensagem:
   ```
   [info] Access ProjectElixirRustLuaWeb.Endpoint at http://localhost:4000
   ```

4. **IMPORTANTE**: Aguarde mais 5-10 segundos após essa mensagem para o servidor terminar de inicializar completamente.

5. Abra seu navegador e acesse:
   ```
   http://localhost:4000
   ```

## Se Não Funcionar

Se você ainda receber "ERR_CONNECTION_REFUSED":

1. Verifique se o servidor ainda está rodando no terminal
2. Tente acessar `http://127.0.0.1:4000` em vez de `localhost:4000`
3. Verifique se há alguma mensagem de erro no terminal
4. Certifique-se de que nenhum outro processo está usando a porta 4000

## Solução Alternativa

Se o problema persistir, tente:

```bash
cd elixir_backend
MIX_ENV=dev PORT=4000 mix phx.server
```

E aguarde pelo menos 15 segundos antes de tentar acessar no navegador.

