# CLAUDE.md

## プロジェクト概要
- システム名: Hit Poker
- 概要: テキサスホールデムベースの独自ルールオンライン対戦ポーカー
- MVP目標: 6人卓でリアルタイム対戦が実際に動く状態

## モノレポ構成
```
hit-poker/
├── server/          # Node.js + TypeScript + Socket.io
├── client/          # Next.js + TypeScript + Tailwind CSS v3
├── shared/          # 共有型定義（両側からimport）
├── CLAUDE.md        # このファイル
└── SKILL.md         # スキル定義
```

## 技術スタック（変更禁止）

### サーバー
- Node.js + TypeScript
- Socket.io 4.x
- jest（ゲームエンジンのユニットテスト）

### クライアント
- Next.js 14 App Router
- TypeScript
- Zustand（クライアント状態管理）
- Tailwind CSS v3（v4禁止）
- socket.io-client

### Tailwind CSS 厳守
- postcss.config.js: `module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } }`
- v4構文（@theme等）は使用禁止

## コーディング規約
- any型禁止
- 関数は単一責任（1関数1役割）
- ゲームエンジンはpure function中心（副作用分離）
- エラーはResult型パターンで扱う（throw乱用禁止）
- socket.io イベント名はすべて shared/types/socket.ts に集約
- コメントは日本語可・英語可（混在禁止、ファイル単位で統一）

## セキュリティ規約（絶対厳守）
- サーバーからクライアントへの送信時、他プレイヤーのholeCardsは除去すること
- アクション受信時は必ずサーバーサイドで検証（bet-validator.ts）
- roomIdの存在確認・playerIdの一致確認を必ず行う
- オールイン後の不正アクション送信を無視する処理を入れる

## 開発コマンド
```bash
# サーバー起動
cd server && npm run dev

# クライアント起動
cd client && npm run dev

# テスト実行
cd server && npm test
```
