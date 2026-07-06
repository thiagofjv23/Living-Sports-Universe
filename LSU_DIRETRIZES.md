# Diretrizes de Arquitetura: Living Sports Universe (LSU)

> Documento canônico de referência. Deve ser lido **antes** de qualquer decisão
> de programação ou mudança de arquitetura. Nenhuma decisão técnica pode
> contrariar o que está descrito aqui sem atualização explícita deste arquivo.

## 1. Filosofia e Visão Geral

- O projeto é um universo esportivo **vivo, persistente e totalmente simulado**.
- A maior inspiração de interface e navegação é a **Wikipédia**.
- O foco principal é criar **histórias emergentes** através da simulação
  matemática, sem exigir microgestão do usuário.
- A história gera **páginas navegáveis de forma dinâmica** utilizando os dados
  da simulação.

## 2. Princípios Arquiteturais e Lógicos

- O projeto utiliza **Arquitetura Orientada a Eventos (Event Sourcing)** e o
  padrão **Pub/Sub**.
- O fluxo de vida de um dado é:
  **Simulação → Eventos → Histórico → Páginas → Exploração**.
- O **Núcleo (Core)** do sistema é agnóstico e **nunca** deve conhecer regras
  específicas de um esporte.
- O Núcleo gerencia apenas as **entidades globais** (Pessoas, Organizações,
  Competições, Eventos) e a **Memória Histórica**.
- Os **Módulos Esportivos** apenas rodam cálculos matemáticos e devolvem um
  **"Pacote de Fatos" (JSON)** para o Núcleo através de um **Event Bus**.
- A interface visual (HTML/DOM) aplica o conceito de **CQRS**: ela apenas **lê**
  a Memória Histórica para renderizar a tela, **sem nunca alterar os resultados**.

## 3. Diretrizes de Estrutura de Arquivos e Modularidade

- O projeto deve ser construído de forma **modular desde o primeiro dia**.
- **Nunca** agrupe toda a lógica em um único arquivo.
- O **Núcleo (Core)** e os **Módulos Esportivos** devem viver em arquivos
  JavaScript **separados**.
- O **Event Bus** e a **Memória Histórica** não devem estar misturados com o
  código que altera o visual da tela (manipulação de DOM).
