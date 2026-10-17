# ✳ ARQUIVO VIVO / ED. 02

**Documentação dos capítulos interativos do portfólio original de Luiz Eduardo.**

[← Voltar ao README](../README.md) · [Abrir o portfólio](https://portifolio-projetos-git-main-pedro-luiz.vercel.app/) · [Código JavaScript](../projetos/arquivo-vivo.js) · [CSS da edição](../projetos/arquivo-vivo.css)

## Propósito

As experiências desta edição expandem as páginas originais do portfólio. A escolha técnica foi **adicionar duas folhas de código organizadas** sem reescrever os projetos antigos e sem depender de serviços pagos para funcionar.

- HTML principal: `projetos/index.html`
- CSS legado: `projetos/style.css`
- JavaScript legado: `projetos/script.js`
- Animações existentes: `projetos/motion.js`
- Novos estilos: `projetos/arquivo-vivo.css`
- Novas interações: `projetos/arquivo-vivo.js`

## 8 capítulos

| Capítulo | ID/Âncora | O que fazer |
| --- | --- | --- |
| Evolução GitHub | `#evolucao` | Ler etapas do aprendizado com links para páginas reais e commits |
| Julya.exe | `#julya-exe` | Escolher entre quatro cartas interativas |
| Tofu World | `#tofu-world` | Brincar, contemplar a foto e contar carinhos virtuais |
| Sala de Música | `#sala-musica` | Escolher uma faixa em destaque neste navegador e explorar músicas no Spotify |
| Laboratório SENAI | `#senai-lab` | Alternar exemplos didáticos de HTML, CSS e JavaScript |
| Mangateca | `#mangateca` | Pesquisar, filtrar, marcar favorito e estado, sortear |
| Segredos | `#segredos` | Colecionar três fragmentos e abrir uma mensagem |
| Modo Mangá | Controles fixos na tela | Navegar entre oito capítulos selecionados |

### A leitura em estilo mangá

A experiência **não reproduz páginas de mangás existentes**. Ela usa conceitos visuais e a navegação por capítulos para organizar textos e projetos próprios.

- Clique em **LER COMO MANGÁ** na abertura ou no botão **☷** no índice fixo.
- Use **ANTERIOR** e **PRÓXIMO** ou as setas **← →** do teclado.
- **Esc** encerra o modo.
- O atalho não interfere na digitação em inputs, textareas, selects ou no menu de busca global.
- O modo pode lembrar o estado escolhido neste navegador.

### Procurar os exercícios

A seção **Projetos** reúne 19 cartões de trabalhos feitos em diferentes fases do meu aprendizado. A busca ignora a diferença entre letras com e sem acentos. Você também pode filtrar por:

- **TODOS**: lista completa.
- **ESTRUTURA**: atividades com foco em organização de conteúdo HTML.
- **ESTILO CSS**: prática de seletores, botões e espaçamento.
- **PÁGINAS**: exercícios de páginas completas ou de conteúdo.

Os filtros não alteram os arquivos, não enviam nenhuma consulta a servidores e podem ser removidos pelo botão **LIMPAR BUSCA**.

### Mangateca

As 22 obras possuem cartões com informações curtas, sem reprodução de capítulos protegidos. Os controles de estado giram entre:

```text
DESCOBRIR → QUERO LER → LENDO → JÁ TENHO → DESCOBRIR
```

Há filtros por tema, filtro por estado, busca de títulos, favoritos, contador e sorteio de uma obra visível. O link **PESQUISAR EDIÇÃO** abre uma busca no Google Books, não um leitor pirata.

A página começa com **Oyasumi Punpun marcado como já tenho**, e com algumas obras citadas na lista de desejos como **quero ler**. Isso é só um estado inicial; cada pessoa pode alterar sua versão local.

### Sala de Música: reproduzir áudio de verdade

Esta edição oferece **duas opções de reprodução no navegador**:

1. **Spotify Embed oficial**: copie o link público de uma faixa, playlist, álbum, episódio ou show, cole na Sala de Música e clique em **ABRIR PLAYER**. É criado um iframe do domínio oficial `open.spotify.com`; ele não começa sozinho e pode ter limitações de playback dependendo da conta e do conteúdo. O site aceita apenas identificadores de conteúdo do Spotify e não carrega outros endereços.
2. **Áudio local**: escolha um arquivo MP3, M4A, OGG ou WAV de até **30 MB**. O navegador toca usando a tag HTML `audio`. Ele não é enviado a servidores nem persistido; ao recarregar a página será necessário selecioná-lo novamente.

Os dois players são independentes. Para remover uma música, use o respectivo botão de limpar ou descarregar.

A faixa em destaque anterior continua existindo e é **editada manualmente por quem visita**, salva apenas naquele navegador. Nem o destaque nem o Spotify Embed conseguem ler o que o Luiz está ouvindo ao vivo.

#### Como deixar uma música fixa para todos os visitantes

No Spotify: **Compartilhar → Incorporar música** (ou playlist) → copiar código. Para definir a mesma seleção permanentemente para os visitantes do seu portfólio, adicione no arquivo `projetos/index.html` o iframe fornecido pelo Spotify ou defina uma URL padrão no código do site e publique o commit. **Colar um link no formulário do site apenas modifica o navegador atual**, pois não existe painel de administrador nem servidor que grave essa escolha globalmente.

**Atenção:** Spotify oferece a reprodução conforme o conteúdo e as regras da própria plataforma. Se optar por publicar arquivos de áudio hospedados no GitHub, certifique-se de ter os direitos necessários, e nunca inclua músicas comerciais sem autorização.

### Julya, Tofu e segredos

As cartas são textos originais do site e mudam quando o visitante clica, sem rede nem armazenamento. O Tofu World é uma brincadeira local. O contador de carinho pode ser reiniciado.

Na área de segredos, cada um dos três cartões registra um fragmento em `localStorage`; ao reunir três, uma mensagem fica disponível. Há também um atalho secreto clássico do teclado, para quem descobrir.

## Privacidade / dados salvos

O módulo usa armazenamento local **apenas** para:

| Chave com prefixo `xqrens:arquivo-vivo:v2:` | Valor guardado |
| --- | --- |
| `manga-mode` | Se o modo mangá foi ligado |
| `manga-shelf` | Estados e favoritos das obras |
| `tofu-pets` | Número de carinhos virtuais |
| `track` | Título e artista inseridos manualmente |
| `fragments` | Identificadores de até três fragmentos |

Ele não envia esses dados para GitHub, Vercel, Spotify ou Supabase e não sabe quem está visitando o site. Navegadores em modo privado e computadores compartilhados podem apagar os dados ao fechar a sessão, ou permitir que outras pessoas vejam dados gravados no mesmo perfil.

O formulário de faixa tem limite de caracteres e é renderizado usando `textContent`, sem inserção de HTML do visitante.

## Animações e acessibilidade

- Suporte a `prefers-reduced-motion` para evitar animações desnecessárias.
- Estado de botões com `aria-pressed`.
- Descrições acessíveis em campos de busca e navegação.
- Atualização de conteúdo com `aria-live` onde faz sentido.
- Links externos abrem com `rel="noopener noreferrer"`.
- Fallback para manter o conteúdo visível se `IntersectionObserver` não estiver disponível.

Essa é uma **base de acessibilidade**, não uma certificação WCAG. Os recursos ainda precisam de testes manuais em navegadores, celulares e tecnologias assistivas.

## Guia de teste manual

1. Abra `/projetos/` com um servidor local.
2. Confira que as seções antigas, os 19 exercícios e o link do Mente em Flor continuam funcionando.
3. Ative modo leitura, teste próximo, anterior e teclado; pressione Esc.
4. Abra quatro cartas, teste os três controles do Tofu e reinicie a contagem.
5. Teste uma URL válida e uma inválida do Spotify, o botão remover e um MP3 local. Confira que nada toca automaticamente. Grave um título e artista, recarregue e limpe o destaque.
6. Na seção Projetos, pesquise nomes, teste os filtros e depois limpe a busca.
7. Na Mangateca, teste os três filtros, estados, favoritos, sorteio e recarregamento.
8. Percorra as três tecnologias do SENAI, conferindo exemplos e links reais.
9. Colete três fragmentos e abra a mensagem.
10. Repita no celular e com a preferência de movimento reduzido ativada.
11. Teste com armazenamento local bloqueado; o conteúdo deve permanecer legível.

## Por que não "500 funções"?

Mais recursos não significam necessariamente um site melhor. O objetivo é ter **oito experiências reais, mantendo os projetos anteriores**, sem encher a página de controles que não fazem nada.

## Se quiser contribuir

Consulte o [guia de contribuição](../CONTRIBUTING.md) ou [abra uma issue](https://github.com/NeroX07-steam/Portifolio/issues/new/choose) com o erro ou sugestão e passos para reproduzir.

[← Voltar ao README](../README.md)
