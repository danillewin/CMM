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
              customerFullName: "Customer's Full Name",
              additionalStakeholders: "Additional Stakeholders (Name + Position)",
              resultFormat: "How to provide results",
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
            research: {
              title: "Research",
              tabs: {
                overview: "Overview",
                brief: "Brief",
                recruitment: "Recruitment",
                guide: "Guide",
                results: "Results",
                meetings: "Meetings"
              },
              customerFullName: "Customer's Full Name",
              additionalStakeholders: "Additional Stakeholders (Name + Position)",
              addStakeholder: "Add Stakeholder",
              removeStakeholder: "Remove",
              resultFormat: "How to provide results",
              resultFormatOptions: {
                presentation: "Presentation",
                figma: "Figma"
              },
              customerSegmentDescription: "Customer segment(s) description",
              customerSegmentDescriptionPlaceholder: "Text description (region, role, activity)",
              projectBackground: "Project Background",
              projectBackgroundDescription: "Detailed description of the current situation that necessitated the research",
              problemToSolve: "What problem do we want to solve with this research",
              resultsUsage: "How will the research results be used? What decisions need the research results?",
              productMetrics: "Product metrics that will be affected by the research",
              limitations: "What limitations exist and may affect the process/results? (e.g., access to data or team resources)",
              goalsHypothesesQuestions: "Goals / Hypotheses / Questions",
              researchGoals: "What are the main research goals? (what exactly does the team want to learn or achieve as a result of the research)",
              researchHypotheses: "Hypotheses or assumptions that you would like to confirm or refute as a result of the research",
              researchHypothesesPlaceholder: "Hypothesis = object + action + context/consequence",
              keyQuestions: "List of key questions that the research should answer",
              keyQuestionsPlaceholder: "Example questions:\n- How do users interact with the product?\n- What difficulties do they experience?\n- What features would they like to see in the product?",
              additionalInformation: "Additional Information",
              previousResources: "Previous research, data, scripts or other resources that may be useful for current research",
              previousResourcesPlaceholder: "Links to previous studies, existing data, research scripts, reports, or other materials that could inform this research",
              additionalMaterials: "Any additional materials and information that will help better understand the research context",
              additionalMaterialsPlaceholder: "Documentation, background materials, context information, or other resources that provide important context for this research",
              relatedResearches: "Related Researches",
              relatedResearchesPlaceholder: "Select a research project to link with",
              addRelatedResearch: "Add Related Research",
              figmaPrototypeLink: "Figma prototype link",
              figmaPrototypeLinkPlaceholder: "Enter the URL to the Figma prototype for usability testing",
              figmaPrototypeLinkHelp: "Only for usability tests",
              researchType: "Research Type",
              saveBrief: "Save Brief",
              uploadFiles: "Upload Files",
              uploadDescription: "Upload audio or video files to automatically transcribe and add to Full Text",
              processing: "Processing files...",
              processComplete: "Processing complete!"
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
              customerFullName: "ФИО заказчика",
              additionalStakeholders: "Дополнительные заинтересованные лица (ФИО + должность)",
              resultFormat: "В каком виде необходимо предоставить результаты",
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
            research: {
              title: "Исследование",
              tabs: {
                overview: "Обзор",
                brief: "Бриф",
                recruitment: "Рекрутинг",
                guide: "Руководство",
                results: "Результаты",
                meetings: "Встречи"
              },
              customerFullName: "ФИО заказчика",
              additionalStakeholders: "Дополнительные заинтересованные лица (ФИО + должность)",
              addStakeholder: "Добавить заинтересованное лицо",
              removeStakeholder: "Удалить",
              resultFormat: "В каком виде необходимо предоставить результаты",
              resultFormatOptions: {
                presentation: "Презентация",
                figma: "Figma"
              },
              customerSegmentDescription: "Описание сегмента(ов) клиентов",
              customerSegmentDescriptionPlaceholder: "Текстовое описание (регион, роль, деятельность)",
              projectBackground: "Фон проекта",
              projectBackgroundDescription: "Подробное описание текущей ситуации, вызвашей необходимость проведения исследования",
              problemToSolve: "Какую проблему хотим решить этим исследованием",
              resultsUsage: "Как будут использоваться результаты исследования? Для принятия какие решений нужны результаты исследования?",
              productMetrics: "Метрики продукта, на которые окажет влияние исследование",
              limitations: "Какие ограничения существуют и могут повлиять на процесс/результаты? (например, доступ к данным или ресурсы команды)",
              goalsHypothesesQuestions: "Цели / гипотезы / вопросы",
              researchGoals: "Какие основные цели исследования? (что именно команда хочет узнать или добиться в результате исследования)",
              researchHypotheses: "Гипотезы или предположения, которые бы хотели подтвердить или опровергнуть в результате исследования",
              researchHypothesesPlaceholder: "Гипотеза = объект + действие + контекст/следствие",
              keyQuestions: "Список ключевых вопросов, на которые исследование должно дать ответы",
              keyQuestionsPlaceholder: "Примеры вопросов:\n- Как пользователи взаимодействуют с продуктом?\n- Какие трудности они испытывают?\n- Какие функции они хотели бы видеть в продукте?",
              additionalInformation: "Дополнительная информация",
              previousResources: "Предыдущие исследования, данные, скрипты или другие ресурсы, которые могут быть полезны для текущего исследования",
              previousResourcesPlaceholder: "Ссылки на предыдущие исследования, существующие данные, исследовательские скрипты, отчеты или другие материалы, которые могут информировать это исследование",
              additionalMaterials: "Любые дополнительные материалы и информация, которые помогут лучше понять контекст исследования",
              additionalMaterialsPlaceholder: "Документация, справочные материалы, контекстная информация или другие ресурсы, которые предоставляют важный контекст для этого исследования",
              relatedResearches: "Связанные исследования",
              relatedResearchesPlaceholder: "Выберите исследовательский проект для связи",
              addRelatedResearch: "Добавить связанное исследование",
              figmaPrototypeLink: "Ссылка на прототип Figma",
              figmaPrototypeLinkPlaceholder: "Введите URL ссылку на прототип Figma для юзабилити тестирования",
              figmaPrototypeLinkHelp: "Только на юзабилити тестах",
              researchType: "Тип исследования",
              saveBrief: "Сохранить бриф",
              uploadFiles: "Загрузить файлы",
              uploadDescription: "Загрузите аудио или видео файлы для автоматической транскрипции и добавления в полный текст",
              processing: "Обработка файлов...",
              processComplete: "Обработка завершена!"
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