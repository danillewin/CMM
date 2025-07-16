import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Check if i18next is already initialized
if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      lng: 'en', // Default language
      fallbackLng: 'en',
      
      debug: import.meta.env.MODE === 'development',
      
      interpolation: {
        escapeValue: false, // React already escapes values
      },
      
      detection: {
        order: ['localStorage', 'navigator', 'htmlTag'],
        caches: ['localStorage'],
        lookupLocalStorage: 'i18nextLng',
      },
      
      react: {
        useSuspense: false,
      },
      
      // Load resources directly inline
      resources: {
        en: {
          translation: {
            navigation: {
              dashboard: "Dashboard",
              researches: "Researches",
              meetings: "Meetings",
              calendar: "Calendar",
              roadmap: "Roadmap",
              jtbds: "Jobs to be Done"
            },
            meetings: {
              title: "Client Meetings",
              newMeeting: "New Meeting",
              respondentName: "Respondent Name",
              respondentPosition: "Position",
              cnum: "CNUM",
              gcc: "GCC",
              companyName: "Company",
              email: "Email",
              researcher: "Researcher",
              relationshipManager: "RM",
              recruiter: "Recruiter",
              date: "Date",
              research: "Research",
              status: "Status",
              notes: "Notes",
              hasGift: "Gift",
              statusInProgress: "In Progress",
              statusSet: "Set",
              statusDone: "Done",
              statusDeclined: "Declined",
              giftYes: "Yes",
              giftNo: "No",
              noMeetings: "No notes"
            },
            researches: {
              title: "Researches",
              newResearch: "New Research",
              name: "Name",
              team: "Team",
              researcher: "Researcher",
              description: "Description",
              dateStart: "Start Date",
              dateEnd: "End Date",
              status: "Status",
              color: "Color",
              researchType: "Research Type",
              products: "Products",
              brief: "Brief",
              guide: "Guide",
              fullText: "Full Text",
              clientsWeSearchFor: "Clients We Search For",
              inviteTemplate: "Invite Template",
              actions: "Actions",
              edit: "Edit",
              delete: "Delete",
              noResearches: "No researches found",
              statusPlanned: "Planned",
              statusInProgress: "In Progress",
              statusDone: "Done",
              table: "Table",
              cards: "Cards",
              startsInWeeks: "Starts in next weeks",
              selectResearchType: "Select Research Type",
              selectProducts: "Select Products"
            },
            jtbds: {
              title: "Jobs to be Done",
              newJtbd: "New JTBD",
              name: "Title",
              jobStatement: "Job Statement",
              jobStory: "Job Story",
              description: "Description",
              category: "Category",
              priority: "Priority",
              level: "Level",
              contentType: "Content Type",
              actions: "Actions",
              edit: "Edit",
              delete: "Delete",
              noJtbds: "No JTBDs found",
              addToResearch: "Add to Research",
              addToMeeting: "Add to Meeting",
              removeFromResearch: "Remove from Research",
              removeFromMeeting: "Remove from Meeting",
              parentJtbd: "Parent JTBD"
            },
            forms: {
              loading: "Loading...",
              save: "Save",
              saving: "Saving..."
            },
            filters: {
              status: "Status",
              all: "All"
            },
            errors: {
              generic: "An error occurred"
            }
          }
        },
        ru: {
          translation: {
            navigation: {
              dashboard: "Панель управления",
              researches: "Исследования",
              meetings: "Встречи",
              calendar: "Календарь",
              roadmap: "Дорожная карта",
              jtbds: "Задачи"
            },
            meetings: {
              title: "Встречи с клиентами",
              newMeeting: "Новая встреча",
              respondentName: "Имя респондента",
              respondentPosition: "Позиция",
              cnum: "CNUM",
              gcc: "GCC",
              companyName: "Компания",
              email: "Email",
              researcher: "Исследователь",
              relationshipManager: "RM",
              recruiter: "Рекрутер",
              date: "Дата",
              research: "Исследование",
              status: "Статус",
              notes: "Заметки",
              hasGift: "Подарок",
              statusInProgress: "В процессе",
              statusSet: "Назначена",
              statusDone: "Завершена",
              statusDeclined: "Отклонена",
              giftYes: "Да",
              giftNo: "Нет",
              noMeetings: "Нет заметок"
            },
            researches: {
              title: "Исследования",
              newResearch: "Новое исследование",
              name: "Название",
              team: "Команда",
              researcher: "Исследователь",
              description: "Описание",
              dateStart: "Дата начала",
              dateEnd: "Дата окончания",
              status: "Статус",
              color: "Цвет",
              researchType: "Тип исследования",
              products: "Продукты",
              brief: "Бриф",
              guide: "Руководство",
              fullText: "Полный текст",
              clientsWeSearchFor: "Клиенты, которых мы ищем",
              inviteTemplate: "Шаблон приглашения",
              actions: "Действия",
              edit: "Редактировать",
              delete: "Удалить",
              noResearches: "Исследования не найдены",
              statusPlanned: "Запланировано",
              statusInProgress: "В процессе",
              statusDone: "Завершено",
              table: "Таблица",
              cards: "Карточки",
              startsInWeeks: "Начинается в следующие недели",
              selectResearchType: "Выберите тип исследования",
              selectProducts: "Выберите продукты"
            },
            jtbds: {
              title: "Задачи для выполнения",
              newJtbd: "Новая задача",
              name: "Название",
              jobStatement: "Постановка задачи",
              jobStory: "История задачи",
              description: "Описание",
              category: "Категория",
              priority: "Приоритет",
              level: "Уровень",
              contentType: "Тип контента",
              actions: "Действия",
              edit: "Редактировать",
              delete: "Удалить",
              noJtbds: "Задачи не найдены",
              addToResearch: "Добавить к исследованию",
              addToMeeting: "Добавить к встрече",
              removeFromResearch: "Убрать из исследования",
              removeFromMeeting: "Убрать из встречи",
              parentJtbd: "Родительская задача"
            },
            forms: {
              loading: "Загрузка...",
              save: "Сохранить",
              saving: "Сохранение..."
            },
            filters: {
              status: "Статус",
              all: "Все"
            },
            errors: {
              generic: "Произошла ошибка"
            }
          }
        }
      }
    });
}

export default i18n;