# DEXONIR

## Постановка задачи: арбитраж котировок пар токенов на разных криптобиржах с целью получения выгоды из разницы стоимости (обменного курса) на разных площадках по одним и тем же парам

## Environment Variables (.env)

Следующие переменные **обязательны** для корректной работы арбитражного бота:

### WALLETS

| Переменная                        | Описание                                                                          |
| --------------------------------- | --------------------------------------------------------------------------------- |
| `WALLET_SOLANA_KEYGEN_SECRET_KEY` | Секретный ключ Solana, созданный через `solana-keygen` (в виде JSON-массива байт) |
| `WALLET_SOLFLARE_SECRET_KEY`      | Секретный ключ Solflare-кошелька (в виде JSON-массива байт)                       |
| `WALLET_METAMASK_PUBLIC_KEY`      | Публичный ключ Metamask (для EVM-сетей)                                           |

### Общие настройки

| Переменная   | Описание                                                     |
| ------------ | ------------------------------------------------------------ |
| `TX_VERSION` | Версия используемой транзакции (например: `V0` или `LEGACY`) |

### ByBit (личный аккаунт)

| Переменная         | Описание             |
| ------------------ | -------------------- |
| `API_KEY_BYBIT`    | API-ключ для доступа |
| `API_SECRET_BYBIT` | Секретный ключ       |

### ANKR

| Переменная     | Описание                                                               |
| -------------- | ---------------------------------------------------------------------- |
| `ANKR_RPC_URL` | RPC-URL от Ankr (например: `https://rpc.ankr.com/multichain/your_key`) |
| `ANKR_API_KEY` | API-ключ Ankr (если используется для авторизованных запросов)          |

---

## Services - общие функции

1. `ensureTokenAccount` - Создаёт Associated Token Account (ATA) для заданного токена, если он ещё не существует на кошельке.

2. `getWalletsFromEnv` - Функция извлекает закрытые ключи (Solana-Keygen, Solflare) и публичные адреса (Metamask) криптовалютных кошельков из переменных окружения .env, валидирует их наличие и преобразует в подходящие форматы (два ключа — в Uint8Array, один — в строку).

3. `checkFullWalletBalances` - Проверяет и выводит балансы всех поддерживаемых кошельков.

4. `checkEvmWalletBalance` - Проверяет и выводит баланс заданного EVM-совместимого кошелька на нескольких сетях.

5. `checkByBitWalletBalance` - Проверяет и выводит баланс кошелька пользователя на бирже Bybit

## Entities

### Raydium

#### services (public)

1. `getPopularRaydiumTokens` - Получает список уникальных популярных токенов из топ-50 пулов Raydium, отсортированных по 24-часовому объему торгов (по умолчанию).

2. `getTopRaydiumPoolByTokens` - Получает лучший (наиболее ликвидный или с максимальным объемом) пул Raydium для заданной пары токенов.

3. `initializeRaydiumSdk` - Инициализирует экземпляр Raydium SDK с текущим соединением, владельцем и кластером.

4. `swapRaydiumBaseIn` - Универсальный свап Raydium (base-in), поддерживает любые пары SPL-токенов или SOL.

5. `getRaydiumSwapFeePercent` - Возвращает общую комиссию в процентах (%) для Raydium пула

#### api (private)

1. `getComputeSwapBase` - Функция для получения информации о расчёте обмена на основе входных или выходных данных, позволяет рассчитать параметры будущего свапа, не совершая саму транзакцию.

2. `postTransactionSwap` - Отправляет POST-запрос к Raydium API для получения подписываемых транзакций свапа.

3. `signAndSendTransactions` - Подписывает и отправляет массив транзакций в сеть Solana

4. `fetchDecimals` - Получает количество десятичных знаков (decimals) для токена по его mint адресу.

5. `getPriorityFees` - Получает приоритетные комиссии (priority fees) с API Raydium для расчёта compute unit price.

6. `fetchTokenAccountData` - Получает информацию обо всех токен-аккаунтах (включая SOL, SPL и SPL 2022) пользователя

#### Полезные ресурсы

1. [https://deepwiki.com/raydium-io/raydium-sdk-V2-demo/7.1-caching-system](https://deepwiki.com/raydium-io/raydium-sdk-V2-demo/7.1-caching-system) - Как устроена система кэширования в Raydium.
2. [https://deepwiki.com/raydium-io/raydium-sdk-V2/3.3-api-service](https://deepwiki.com/raydium-io/raydium-sdk-V2/3.3-api-service) - Полная документация api service.

### Meteora

1. `getMeteoraTokenPrice` - Получает цену токена из активного бина пула Meteora

2. `getPositionsState` - Получает и выводит данные позиции пользователя в DLMM-пуле Meteora.

3. `initializeDLMMinstance` - Инициализирует экземпляр DLMM для заданного пула Meteora.

### ByBit

1. `_swapUsdcToSolByBit` - Выполняет рыночную сделку на Bybit: продаёт USDC за SOL (пара SOL/USDC).

2. `initializeBybitWebSocket` - Инициализирует WebSocket-соединение с Bybit и подписывается на пары из `trackedPairs`. Автоматически определяет категорию (spot, linear и т.д.) для каждого символа.

#### api (private)

1. `initApi` - инициализация test и ws.
2. `syncBybitTime` - синхронизация времени с серверами ByBit

## Общая информация

`Gross` - Это валовая (грубая) прибыль, рассчитанная только по разнице цен между Raydium и Bybit, без учета комиссий.
`Net` - Это чистая прибыль, уже с учетом всех комиссий (Raydium + Bybit).
