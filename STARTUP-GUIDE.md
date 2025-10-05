# 🚀 ThinkCode AI Platform - Complete System Startup Guide

## 📋 System Overview

ThinkCode AI Platform to kompleksowy system zarządzania projektami z wykorzystaniem AI agentów. System składa się z trzech głównych komponentów:

- **Frontend Dashboard** (port 3001) - Interfejs użytkownika
- **Backend API** (port 3002) - Główny serwer API z przetwarzaniem dokumentów
- **Agents API** (port 3003) - Serwer zarządzania agentami AI

## ⚡ Quick Start - Uruchomienie całego systemu

### 1. Automatyczne uruchomienie wszystkich serwisów

```bash
# Uruchom cały system jedną komendą
npm run platform:start
```

Ta komenda automatycznie uruchomi:

- ✅ Backend API Server (port 3002)
- ✅ AI Agents API Server (port 3003)
- ✅ Frontend Dashboard (port 3001)

### 2. Dostęp do aplikacji

Po uruchomieniu systemu dostępne są:

| Serwis                   | URL                                        | Opis                         |
| ------------------------ | ------------------------------------------ | ---------------------------- |
| **Main Dashboard**       | http://localhost:3001                      | Główny dashboard             |
| **Enterprise Dashboard** | http://localhost:3001/enterprise-dashboard | **PEŁNY SYSTEM ZARZĄDZANIA** |
| Backend API              | http://localhost:3002/api/health           | Health check backend         |
| Agents API               | http://localhost:3003/api/health           | Health check agentów         |

## 🎯 Enterprise Dashboard - Główne funkcjonalności

### **📊 Dashboard Overview**

- Statystyki projektów w czasie rzeczywistym
- Status wszystkich AI agentów
- Średnie obciążenie zespołu
- Ostatnia aktywność projektów

### **📁 Projects Management**

- **Tworzenie nowych projektów** z wyborem typu
- **Zarządzanie statusem** projektów (planning → in-progress → completed)
- **Filtrowanie i wyszukiwanie** projektów
- **Przypisywanie workflow** do projektów
- **Tracking progress** każdego projektu

### **🤖 AI Agents Management**

- **9 wyspecjalizowanych agentów**:
  - Sarah Chen - Business Analyst
  - Marcus Rodriguez - Systems Analyst
  - Elena Kowalski - Software Architect
  - Alex Thompson - Backend Developer
  - Zoe Park - Frontend Developer
  - Maya Patel - UI/UX Designer
  - James Wilson - QA Engineer
  - Raj Kumar - DevOps Engineer
  - Tomasz Nowakowski - Test Automation
- **Real-time workload monitoring**
- **Aktywacja/deaktywacja agentów**
- **Filtrowanie po roli i statusie**

### **🔄 Workflows & Team Assignment**

- **Automatyczne rekomendacje teamów** na podstawie typu projektu
- **Przypisywanie agentów** do konkretnych zadań
- **Tracking postępu** każdego workflow step
- **Komunikacja między agentami**

## 🔧 Development - Uruchomienie ręczne

Jeśli chcesz uruchamiać serwisy osobno:

### Backend API (port 3002)

```bash
cd backend
npm run dev
# lub
npx tsx src/server.ts
```

### Agents API (port 3003)

```bash
cd backend
npx tsx src/agents-server.ts
```

### Frontend (port 3001)

```bash
npm run dev:frontend
# lub
npx next dev -p 3001
```

## 🗄️ Database & Agents

### Baza danych Prisma

System używa SQLite z Prisma ORM:

```bash
npx prisma generate  # Generuj klienta
npx prisma studio    # GUI dla bazy danych
```

### AI Agents w bazie

System ma 9 pre-configured agentów ready do pracy:

- Wszyscy agenci mają 0% workload na start
- Mogą być przypisywani do projektów
- Komunikują się między sobą
- Trackują swoje decyzje i progress

## 🌐 API Endpoints

### Backend API (3002)

- `GET /api/health` - Health check
- `POST /api/analyze-documents` - Analiza dokumentów
- `POST /api/generate-tasks` - Generowanie zadań
- `GET /api/test-integrations` - Test integracji

### Agents API (3003)

- `GET /api/agents` - Lista wszystkich agentów
- `GET /api/agents/:id` - Szczegóły agenta
- `PUT /api/agents/:id/status` - Update statusu agenta
- `GET /api/projects` - Lista projektów
- `POST /api/projects` - Tworzenie projektu
- `GET /api/projects/:id` - Szczegóły projektu
- `PUT /api/projects/:id/status` - Update statusu projektu
- `POST /api/projects/:projectId/workflows` - Tworzenie workflow
- `GET /api/projects/:projectId/recommended-team` - Rekomendacje zespołu

## 🚨 Troubleshooting

### Port jest zajęty

```bash
# Windows - kill process na porcie 3001/3002/3003
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### Błędy TypeScript

```bash
# Sprawdź błędy kompilacji
npx tsc --noEmit
```

### Problemy z bazą danych

```bash
# Reset bazy danych
npx prisma migrate reset
npx prisma generate
```

### Czyszczenie cache

```bash
# Usuń node_modules i reinstall
rm -rf node_modules package-lock.json
rm -rf backend/node_modules backend/package-lock.json
npm run install:all
```

## 💡 Next Steps - Rozbudowa

System jest gotowy do dalszej rozbudowy:

1. **Workflow Orchestration** - Automatyczne workflow między agentami
2. **Real-time Communications** - WebSocket komunikacja
3. **Advanced Analytics** - Dashboardy z metrykami
4. **Project Templates** - Gotowe szablony projektów
5. **AI Integration** - Integracja z OpenAI dla agentów
6. **User Management** - Zarządzanie użytkownikami i rolami
7. **Notifications** - System powiadomień
8. **File Management** - Upload i zarządzanie plikami projektów

## 📞 Support

W przypadku problemów:

1. Sprawdź logi w terminalu
2. Zweryfikuj czy wszystkie porty są wolne
3. Sprawdź status bazy danych Prisma
4. Upewnij się że masz Node.js 18+ i npm 9+

---

**🎉 System jest gotowy do produkcyjnego użycia z pełną funkcjonalnością zarządzania projektami i agentami AI!**
