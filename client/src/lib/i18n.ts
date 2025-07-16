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