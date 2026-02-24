---
title: Aetherius SDK 개요 (KO)
version: 1.0.0
language: ko
module: sdk
description: Aetherius SDK 전체 구조와 모듈별 API 문서 인덱스
sidebar:
  label: SDK Overview (KO)
  order: 1
---

# Aetherius SDK 개요

## 1. SDK 구조

- Core
  - World, System, EventBus 등 시뮬레이션 핵심 런타임을 제공하는 모듈.
- Economy
  - Vertic/Edges/Poly 기반 생존 경제와 유전 진화를 제공하는 모듈.
- Events
  - 시뮬레이션 전역에서 사용하는 이벤트 타입과 카테고리를 정의하는 모듈.
- Entities
  - Plant/Creature/Weather 등 엔티티 조립(Assembly)과 카탈로그를 담당하는 모듈.

각 모듈의 SDK-API 문서는 “단일 코드 책임 페이지” 원칙에 따라,  
해당 모듈의 전체 public surface를 한 쌍의 문서(ko/en)가 책임집니다.

## 2. 모듈별 SDK-API 문서

- Economy 모듈
  - [Economy SDK API (KO)](economy.ko.md)
  - [Economy SDK API (EN)](economy.en.md)

추가 모듈(Core/Events/Entities 등)은 Economy와 동일한 패턴으로  
`{모듈명}.ko.md` / `{모듈명}.en.md` 단일 책임 페이지로 확장됩니다.

