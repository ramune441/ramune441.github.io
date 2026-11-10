// Words of the SendReady story promo, per language. story.mjs times them; record-story.mjs puts the demo pages'
// texts into the real extension. Keys follow the extension's UI languages (lib/i18n.js); add a language here first.
// The demo shows, in order: polite rewrite, snippet trigger, inline AI trigger (mail), reply (chat), summary
// (article), own instruction and translation (social post), then the other features as cards.
// `trigger` is the language's greeting snippet trigger from the extension's default presets (lib/presets.js).
export default {
  "ja": {
    "hook": [
      "その返信、",
      "このまま送って大丈夫？"
    ],
    "draft": "木曜は無理です。金曜なら行けます。",
    "tagline": "選んで、整えて、送るだけ。",
    "mail": {
      "app": "メール",
      "folder": "受信トレイ",
      "subject": "打ち合わせ日程のご相談",
      "from": "佐藤 美咲",
      "fromOrg": "株式会社サンプル商事",
      "time": "10:24",
      "body": [
        "お世話になっております。",
        "来週のお打ち合わせですが、木曜日の15時はいかがでしょうか。",
        "ご都合をお聞かせください。"
      ],
      "replyTo": "Re: 打ち合わせ日程のご相談",
      "send": "送信",
      "inline": "資料は明日送ります"
    },
    "chat": {
      "app": "チャット",
      "channel": "プロジェクト",
      "who": "山本 部長",
      "time": "16:02",
      "message": "明日の定例の資料、今日中に共有できそう？",
      "input": "メッセージを入力",
      "send": "送信",
      "gist": "17時までに共有する",
      "me": "あなた"
    },
    "article": {
      "app": "ニュース",
      "section": "テクノロジー",
      "title": "職場の生成AI活用、メール作成が最多に",
      "paragraphs": [
        "民間の調査によると、仕事で生成AIを使う人のうち約6割が「メールやチャットの文章作成」に使っていると回答した。次いで「資料の要約」「翻訳」が多く、文章に関わる業務での利用が目立つ。",
        "一方で、社外秘の情報を入力することへの不安や、出力内容の確認に時間がかかるといった課題も挙がった。専門家は、送信前に人が必ず読み直す運用と、入力する情報を最小限にする工夫が重要だと指摘している。"
      ]
    },
    "sns": {
      "app": "SNS",
      "placeholder": "いまどうしてる？",
      "post": "投稿",
      "draft": "週末、新しくできたカフェに行ってきた。ラテがおいしかった。また行きたい。",
      "instruction": "絵文字を入れて明るく"
    },
    "steps": {
      "polite": "① 選んで「丁寧に」→ 適用",
      "snippet": "② 定型文は「;ose」＋ Tab",
      "inline": "③「//p 文章」＋ Tab でその場で変換",
      "reply": "④ 受け取ったメッセージに返信を作成",
      "summary": "⑤ 長い文章を要約",
      "custom": "⑥ 好きな指示で書き換え",
      "translate": "⑦ そのまま英語に翻訳"
    },
    "more": {
      "title": "ほかにも",
      "cards": [
        "生成履歴からいつでも再コピー",
        "右クリック・Alt+Shift+S でも開ける",
        "プリセットは自由に登録・編集",
        "20言語・どのサイトの入力欄でも"
      ],
      "menu": "SendReady"
    },
    "cta": {
      "title": "送る前のひと手間を、AI に。",
      "chips": [
        "無料",
        "登録不要",
        "20言語"
      ],
      "button": "Chrome に追加",
      "note": "AI 変換は1日50回まで ・ 送るのは選んだ文章だけ"
    },
    "trigger": ";ose"
  },
  "en": {
    "hook": [
      "That reply —",
      "are you sure it's ready to send?"
    ],
    "draft": "Can't do Thursday. Friday works.",
    "tagline": "Select it. Polish it. Send it.",
    "mail": {
      "app": "Mail",
      "folder": "Inbox",
      "subject": "Scheduling our meeting",
      "from": "Emma Clarke",
      "fromOrg": "Northwind Ltd.",
      "time": "10:24",
      "body": [
        "Hi,",
        "Would Thursday at 3 pm work for our meeting next week?",
        "Let me know what suits you."
      ],
      "replyTo": "Re: Scheduling our meeting",
      "send": "Send",
      "inline": "will send the files tomorrow"
    },
    "chat": {
      "app": "Chat",
      "channel": "project",
      "who": "David Brooks (Manager)",
      "time": "4:02 PM",
      "message": "Can you share the slides for tomorrow's meeting today?",
      "input": "Write a message",
      "send": "Send",
      "gist": "I'll share them by 5pm today",
      "me": "You"
    },
    "article": {
      "app": "News",
      "section": "Technology",
      "title": "Writing emails tops the list of AI uses at work",
      "paragraphs": [
        "A recent survey found that about 60% of people who use generative AI at work rely on it to write emails and chat messages. Summarizing documents and translation came next, showing how much of its use centers on writing.",
        "At the same time, respondents raised concerns about entering confidential information and the time it takes to check the output. Experts say it is essential that a person always reads the text before it is sent, and that as little information as possible is entered."
      ]
    },
    "sns": {
      "app": "Social",
      "placeholder": "What's happening?",
      "post": "Post",
      "draft": "Went to the new café this weekend. The latte was good. Want to go again.",
      "instruction": "Make it cheerful with emojis"
    },
    "steps": {
      "polite": "① Select → \"Be Polite\" → Apply",
      "snippet": "② Snippets: \";hi\" + Tab",
      "inline": "③ \"//p text\" + Tab rewrites in place",
      "reply": "④ Draft a reply to a message",
      "summary": "⑤ Summarize long text",
      "custom": "⑥ Rewrite with your own instruction",
      "translate": "⑦ Translate it into Japanese"
    },
    "more": {
      "title": "And more",
      "cards": [
        "Copy again from your history",
        "Open with right-click or Alt+Shift+S",
        "Add and edit your own presets",
        "20 languages, any text field"
      ],
      "menu": "SendReady"
    },
    "cta": {
      "title": "Let AI give it a final polish.",
      "chips": [
        "Free",
        "No sign-up",
        "20 languages"
      ],
      "button": "Add to Chrome",
      "note": "50 AI uses a day · Only the text you select is sent"
    },
    "trigger": ";hi"
  },
  "es": {
    "hook": [
      "Esa respuesta…",
      "¿seguro que está lista para enviar?"
    ],
    "draft": "El jueves no puedo. El viernes sí.",
    "tagline": "Selecciona, pule y envía.",
    "mail": {
      "app": "Correo",
      "folder": "Recibidos",
      "subject": "Fecha para la reunión",
      "from": "Lucía Romero",
      "fromOrg": "Comercial Iberia S.L.",
      "time": "10:24",
      "body": [
        "Hola:",
        "¿Te vendría bien el jueves a las 15:00 para la reunión de la próxima semana?",
        "Dime qué te va mejor."
      ],
      "replyTo": "Re: Fecha para la reunión",
      "send": "Enviar",
      "inline": "mañana te mando los archivos"
    },
    "chat": {
      "app": "Chat",
      "channel": "proyecto",
      "who": "Javier Ortega",
      "time": "16:02",
      "message": "¿Puedes compartir hoy las diapositivas de la reunión de mañana?",
      "input": "Escribe un mensaje",
      "send": "Enviar",
      "gist": "te las comparto hoy antes de las 17:00",
      "me": "Tú"
    },
    "article": {
      "app": "Noticias",
      "section": "Tecnología",
      "title": "Redactar correos, el uso de la IA más común en el trabajo",
      "paragraphs": [
        "Según una encuesta reciente, cerca del 60 % de quienes usan IA generativa en el trabajo la emplean para redactar correos y mensajes de chat. Le siguen resumir documentos y traducir, lo que muestra que su uso se concentra en la escritura.",
        "Al mismo tiempo, los encuestados mostraron inquietud por introducir información confidencial y por el tiempo que lleva revisar los resultados. Los expertos señalan que es clave que una persona lea siempre el texto antes de enviarlo y que se introduzca la menor información posible."
      ]
    },
    "sns": {
      "app": "Social",
      "placeholder": "¿Qué está pasando?",
      "post": "Publicar",
      "draft": "Este finde fui a la cafetería nueva. El latte estaba bueno. Quiero volver.",
      "instruction": "Hazlo alegre y con emojis"
    },
    "steps": {
      "polite": "① Selecciona → «Más educado» → Aplicar",
      "snippet": "② Plantillas: «;hi» + Tab",
      "inline": "③ «//p texto» + Tab y se reescribe ahí mismo",
      "reply": "④ Redacta la respuesta a un mensaje",
      "summary": "⑤ Resume textos largos",
      "custom": "⑥ Reescribe con tus propias instrucciones",
      "translate": "⑦ Tradúcelo al inglés"
    },
    "more": {
      "title": "Y además",
      "cards": [
        "Vuelve a copiar desde el historial",
        "Ábrelo con clic derecho o Alt+Shift+S",
        "Crea y edita tus propios ajustes",
        "20 idiomas, en cualquier campo de texto"
      ],
      "menu": "SendReady"
    },
    "cta": {
      "title": "Deja el último repaso a la IA.",
      "chips": [
        "Gratis",
        "Sin registro",
        "20 idiomas"
      ],
      "button": "Añadir a Chrome",
      "note": "50 usos de IA al día · Solo se envía el texto que seleccionas"
    },
    "trigger": ";hi"
  },
  "fr": {
    "hook": [
      "Cette réponse…",
      "vous êtes sûr de l'envoyer comme ça ?"
    ],
    "draft": "Jeudi, impossible. Vendredi, ça marche.",
    "tagline": "Sélectionnez, peaufinez, envoyez.",
    "mail": {
      "app": "Mail",
      "folder": "Boîte de réception",
      "subject": "Date de notre réunion",
      "from": "Claire Moreau",
      "fromOrg": "Société Lumière",
      "time": "10:24",
      "body": [
        "Bonjour,",
        "Jeudi à 15 h vous conviendrait-il pour notre réunion de la semaine prochaine ?",
        "Dites-moi ce qui vous arrange."
      ],
      "replyTo": "Re : Date de notre réunion",
      "send": "Envoyer",
      "inline": "j'envoie les fichiers demain"
    },
    "chat": {
      "app": "Chat",
      "channel": "projet",
      "who": "Julien Bernard",
      "time": "16:02",
      "message": "Tu peux partager aujourd'hui les slides de la réunion de demain ?",
      "input": "Écrire un message",
      "send": "Envoyer",
      "gist": "je les partage avant 17 h aujourd'hui",
      "me": "Vous"
    },
    "article": {
      "app": "Actualités",
      "section": "Technologie",
      "title": "Rédiger des e-mails, premier usage de l'IA au travail",
      "paragraphs": [
        "Selon une enquête récente, environ 60 % des personnes qui utilisent l'IA générative au travail s'en servent pour rédiger des e-mails et des messages. Viennent ensuite le résumé de documents et la traduction : l'usage se concentre sur l'écrit.",
        "Les répondants s'inquiètent toutefois de saisir des informations confidentielles et du temps nécessaire pour vérifier les résultats. Les experts jugent essentiel qu'une personne relise toujours le texte avant l'envoi et que l'on saisisse le moins d'informations possible."
      ]
    },
    "sns": {
      "app": "Social",
      "placeholder": "Quoi de neuf ?",
      "post": "Publier",
      "draft": "Ce week-end, je suis allé au nouveau café. Le latte était bon. J'ai envie d'y retourner.",
      "instruction": "Rends-le joyeux avec des emojis"
    },
    "steps": {
      "polite": "① Sélectionnez → « Plus poli » → Appliquer",
      "snippet": "② Modèles : « ;hi » + Tab",
      "inline": "③ « //p texte » + Tab pour réécrire sur place",
      "reply": "④ Rédigez la réponse à un message",
      "summary": "⑤ Résumez un long texte",
      "custom": "⑥ Réécrivez selon vos propres consignes",
      "translate": "⑦ Traduisez-le en anglais"
    },
    "more": {
      "title": "Et aussi",
      "cards": [
        "Recopiez depuis l'historique",
        "Ouvrez-le par clic droit ou Alt+Shift+S",
        "Créez et modifiez vos préréglages",
        "20 langues, dans tout champ de texte"
      ],
      "menu": "SendReady"
    },
    "cta": {
      "title": "Confiez la touche finale à l'IA.",
      "chips": [
        "Gratuit",
        "Sans inscription",
        "20 langues"
      ],
      "button": "Ajouter à Chrome",
      "note": "50 utilisations IA par jour · Seul le texte sélectionné est envoyé"
    },
    "trigger": ";hi"
  },
  "de": {
    "hook": [
      "Diese Antwort …",
      "kann die wirklich so raus?"
    ],
    "draft": "Donnerstag geht nicht. Freitag passt.",
    "tagline": "Markieren, feilen, senden.",
    "mail": {
      "app": "Mail",
      "folder": "Posteingang",
      "subject": "Termin für unser Meeting",
      "from": "Anna Schmidt",
      "fromOrg": "Nordlicht GmbH",
      "time": "10:24",
      "body": [
        "Hallo,",
        "passt Ihnen Donnerstag um 15 Uhr für unser Meeting nächste Woche?",
        "Geben Sie mir gern Bescheid."
      ],
      "replyTo": "AW: Termin für unser Meeting",
      "send": "Senden",
      "inline": "ich schicke die Unterlagen morgen"
    },
    "chat": {
      "app": "Chat",
      "channel": "projekt",
      "who": "Thomas Becker",
      "time": "16:02",
      "message": "Kannst du die Folien für das Meeting morgen heute noch teilen?",
      "input": "Nachricht schreiben",
      "send": "Senden",
      "gist": "ich teile sie heute bis 17 Uhr",
      "me": "Du"
    },
    "article": {
      "app": "Nachrichten",
      "section": "Technik",
      "title": "E-Mails schreiben ist der häufigste KI-Einsatz im Job",
      "paragraphs": [
        "Laut einer aktuellen Umfrage nutzen rund 60 % derjenigen, die bei der Arbeit generative KI verwenden, sie zum Schreiben von E-Mails und Chatnachrichten. Danach folgen das Zusammenfassen von Dokumenten und Übersetzungen – der Einsatz dreht sich vor allem ums Schreiben.",
        "Zugleich äußerten die Befragten Bedenken, vertrauliche Informationen einzugeben, und kritisierten den Aufwand, die Ergebnisse zu prüfen. Fachleute halten es für entscheidend, dass ein Mensch den Text vor dem Senden immer liest und möglichst wenig Information eingegeben wird."
      ]
    },
    "sns": {
      "app": "Social",
      "placeholder": "Was gibt's Neues?",
      "post": "Posten",
      "draft": "Am Wochenende war ich im neuen Café. Der Latte war gut. Will wieder hin.",
      "instruction": "Mach es fröhlich mit Emojis"
    },
    "steps": {
      "polite": "① Markieren → „Höflicher“ → Übernehmen",
      "snippet": "② Textbausteine: „;hi“ + Tab",
      "inline": "③ „//p Text“ + Tab formuliert direkt um",
      "reply": "④ Antwort auf eine Nachricht entwerfen",
      "summary": "⑤ Lange Texte zusammenfassen",
      "custom": "⑥ Mit eigener Anweisung umschreiben",
      "translate": "⑦ Direkt ins Englische übersetzen"
    },
    "more": {
      "title": "Und mehr",
      "cards": [
        "Aus dem Verlauf erneut kopieren",
        "Per Rechtsklick oder Alt+Shift+S öffnen",
        "Eigene Vorlagen anlegen und bearbeiten",
        "20 Sprachen, in jedem Textfeld"
      ],
      "menu": "SendReady"
    },
    "cta": {
      "title": "Den letzten Schliff macht die KI.",
      "chips": [
        "Kostenlos",
        "Ohne Anmeldung",
        "20 Sprachen"
      ],
      "button": "Zu Chrome hinzufügen",
      "note": "50 KI-Aufrufe pro Tag · Gesendet wird nur der markierte Text"
    },
    "trigger": ";hi"
  },
  "it": {
    "hook": [
      "Quella risposta…",
      "sei sicuro di inviarla così?"
    ],
    "draft": "Giovedì non posso. Venerdì sì.",
    "tagline": "Seleziona, rifinisci, invia.",
    "mail": {
      "app": "Posta",
      "folder": "Posta in arrivo",
      "subject": "Data della riunione",
      "from": "Giulia Rossi",
      "fromOrg": "Aurora S.r.l.",
      "time": "10:24",
      "body": [
        "Buongiorno,",
        "giovedì alle 15 andrebbe bene per la riunione della prossima settimana?",
        "Mi faccia sapere."
      ],
      "replyTo": "Re: Data della riunione",
      "send": "Invia",
      "inline": "mando i file domani"
    },
    "chat": {
      "app": "Chat",
      "channel": "progetto",
      "who": "Marco Bianchi",
      "time": "16:02",
      "message": "Riesci a condividere oggi le slide per la riunione di domani?",
      "input": "Scrivi un messaggio",
      "send": "Invia",
      "gist": "le condivido oggi entro le 17",
      "me": "Tu"
    },
    "article": {
      "app": "Notizie",
      "section": "Tecnologia",
      "title": "Scrivere email è l'uso più diffuso dell'IA al lavoro",
      "paragraphs": [
        "Secondo un recente sondaggio, circa il 60% di chi usa l'IA generativa al lavoro se ne serve per scrivere email e messaggi in chat. Seguono il riassunto di documenti e la traduzione: l'uso si concentra sulla scrittura.",
        "Allo stesso tempo, gli intervistati hanno espresso timori nell'inserire informazioni riservate e per il tempo necessario a controllare i risultati. Gli esperti sottolineano che è fondamentale che una persona rilegga sempre il testo prima dell'invio e che si inseriscano meno informazioni possibile."
      ]
    },
    "sns": {
      "app": "Social",
      "placeholder": "Che succede?",
      "post": "Pubblica",
      "draft": "Nel weekend sono stato al nuovo bar. Il latte macchiato era buono. Voglio tornarci.",
      "instruction": "Rendilo allegro con le emoji"
    },
    "steps": {
      "polite": "① Seleziona → «Più cortese» → Applica",
      "snippet": "② Testi rapidi: «;hi» + Tab",
      "inline": "③ «//p testo» + Tab e si riscrive lì",
      "reply": "④ Prepara la risposta a un messaggio",
      "summary": "⑤ Riassumi testi lunghi",
      "custom": "⑥ Riscrivi con le tue istruzioni",
      "translate": "⑦ Traducilo in inglese"
    },
    "more": {
      "title": "E poi",
      "cards": [
        "Ricopia dalla cronologia",
        "Aprilo con il tasto destro o Alt+Shift+S",
        "Crea e modifica i tuoi preset",
        "20 lingue, in qualsiasi campo di testo"
      ],
      "menu": "SendReady"
    },
    "cta": {
      "title": "L'ultimo ritocco lo fa l'IA.",
      "chips": [
        "Gratis",
        "Senza registrazione",
        "20 lingue"
      ],
      "button": "Aggiungi a Chrome",
      "note": "50 usi dell'IA al giorno · Viene inviato solo il testo selezionato"
    },
    "trigger": ";hi"
  },
  "nl": {
    "hook": [
      "Dat antwoord…",
      "kun je dat zo versturen?"
    ],
    "draft": "Donderdag lukt niet. Vrijdag wel.",
    "tagline": "Selecteren, bijschaven, versturen.",
    "mail": {
      "app": "Mail",
      "folder": "Inbox",
      "subject": "Datum voor ons overleg",
      "from": "Sanne de Vries",
      "fromOrg": "Polder B.V.",
      "time": "10:24",
      "body": [
        "Hallo,",
        "Zou donderdag om 15.00 uur uitkomen voor ons overleg volgende week?",
        "Laat maar weten wat jou past."
      ],
      "replyTo": "Re: Datum voor ons overleg",
      "send": "Versturen",
      "inline": "ik stuur de bestanden morgen"
    },
    "chat": {
      "app": "Chat",
      "channel": "project",
      "who": "Pieter Jansen",
      "time": "16:02",
      "message": "Kun je de slides voor het overleg van morgen vandaag nog delen?",
      "input": "Schrijf een bericht",
      "send": "Versturen",
      "gist": "ik deel ze vandaag voor 17.00 uur",
      "me": "Jij"
    },
    "article": {
      "app": "Nieuws",
      "section": "Technologie",
      "title": "E-mails schrijven is de meest gebruikte AI-toepassing op het werk",
      "paragraphs": [
        "Volgens een recente enquête gebruikt zo'n 60% van de mensen die op het werk generatieve AI inzetten, het voor het schrijven van e-mails en chatberichten. Daarna volgen documenten samenvatten en vertalen: het gebruik draait vooral om schrijven.",
        "Tegelijk noemden de ondervraagden zorgen over het invoeren van vertrouwelijke informatie en de tijd die het kost om de uitkomst te controleren. Experts vinden het essentieel dat een mens de tekst altijd leest voor verzending en dat er zo weinig mogelijk informatie wordt ingevoerd."
      ]
    },
    "sns": {
      "app": "Social",
      "placeholder": "Wat is er aan de hand?",
      "post": "Plaatsen",
      "draft": "Dit weekend naar het nieuwe café geweest. De latte was lekker. Wil er weer heen.",
      "instruction": "Maak het vrolijk met emoji's"
    },
    "steps": {
      "polite": "① Selecteer → 'Beleefder' → Toepassen",
      "snippet": "② Tekstblokken: ';hi' + Tab",
      "inline": "③ '//p tekst' + Tab herschrijft ter plekke",
      "reply": "④ Stel een antwoord op een bericht op",
      "summary": "⑤ Vat lange tekst samen",
      "custom": "⑥ Herschrijf met je eigen instructie",
      "translate": "⑦ Vertaal het naar het Engels"
    },
    "more": {
      "title": "En meer",
      "cards": [
        "Opnieuw kopiëren uit de geschiedenis",
        "Openen met rechtsklik of Alt+Shift+S",
        "Eigen presets maken en bewerken",
        "20 talen, in elk tekstveld"
      ],
      "menu": "SendReady"
    },
    "cta": {
      "title": "De laatste hand legt de AI.",
      "chips": [
        "Gratis",
        "Geen account",
        "20 talen"
      ],
      "button": "Toevoegen aan Chrome",
      "note": "50 AI-acties per dag · Alleen de geselecteerde tekst wordt verstuurd"
    },
    "trigger": ";hi"
  },
  "pl": {
    "hook": [
      "Ta odpowiedź…",
      "na pewno można ją tak wysłać?"
    ],
    "draft": "W czwartek nie dam rady. Piątek pasuje.",
    "tagline": "Zaznacz, dopracuj, wyślij.",
    "mail": {
      "app": "Poczta",
      "folder": "Odebrane",
      "subject": "Termin naszego spotkania",
      "from": "Anna Kowalska",
      "fromOrg": "Wisła Sp. z o.o.",
      "time": "10:24",
      "body": [
        "Dzień dobry,",
        "czy czwartek o 15:00 odpowiadałby Panu na spotkanie w przyszłym tygodniu?",
        "Proszę dać znać."
      ],
      "replyTo": "Re: Termin naszego spotkania",
      "send": "Wyślij",
      "inline": "jutro wyślę pliki"
    },
    "chat": {
      "app": "Czat",
      "channel": "projekt",
      "who": "Piotr Nowak",
      "time": "16:02",
      "message": "Dasz radę udostępnić dziś slajdy na jutrzejsze spotkanie?",
      "input": "Napisz wiadomość",
      "send": "Wyślij",
      "gist": "udostępnię je dziś do 17:00",
      "me": "Ty"
    },
    "article": {
      "app": "Wiadomości",
      "section": "Technologia",
      "title": "Pisanie e-maili najczęstszym zastosowaniem AI w pracy",
      "paragraphs": [
        "Według niedawnego badania około 60% osób korzystających w pracy z generatywnej AI używa jej do pisania e-maili i wiadomości na czacie. Kolejne miejsca zajmują streszczanie dokumentów i tłumaczenie – zastosowania skupiają się na pisaniu.",
        "Jednocześnie ankietowani wskazali obawy przed wpisywaniem poufnych informacji oraz czas potrzebny na sprawdzenie wyników. Eksperci podkreślają, że kluczowe jest, by człowiek zawsze czytał tekst przed wysłaniem i by wpisywać jak najmniej informacji."
      ]
    },
    "sns": {
      "app": "Social",
      "placeholder": "Co słychać?",
      "post": "Opublikuj",
      "draft": "W weekend byłem w nowej kawiarni. Latte było dobre. Chcę tam wrócić.",
      "instruction": "Zrób to radośnie, z emoji"
    },
    "steps": {
      "polite": "① Zaznacz → „Uprzejmiej” → Zastosuj",
      "snippet": "② Szablony: „;hi” + Tab",
      "inline": "③ „//p tekst” + Tab poprawia na miejscu",
      "reply": "④ Przygotuj odpowiedź na wiadomość",
      "summary": "⑤ Streść długi tekst",
      "custom": "⑥ Przepisz według własnego polecenia",
      "translate": "⑦ Przetłumacz na angielski"
    },
    "more": {
      "title": "I jeszcze",
      "cards": [
        "Kopiuj ponownie z historii",
        "Otwórz prawym przyciskiem lub Alt+Shift+S",
        "Twórz i edytuj własne ustawienia",
        "20 języków, w każdym polu tekstowym"
      ],
      "menu": "SendReady"
    },
    "cta": {
      "title": "Ostatni szlif zostaw AI.",
      "chips": [
        "Za darmo",
        "Bez rejestracji",
        "20 języków"
      ],
      "button": "Dodaj do Chrome",
      "note": "50 użyć AI dziennie · Wysyłany jest tylko zaznaczony tekst"
    },
    "trigger": ";hi"
  },
  "pt": {
    "hook": [
      "Essa resposta…",
      "tem certeza de que pode enviar assim?"
    ],
    "draft": "Quinta não dá. Sexta eu consigo.",
    "tagline": "Selecione, ajuste e envie.",
    "mail": {
      "app": "E-mail",
      "folder": "Caixa de entrada",
      "subject": "Data da nossa reunião",
      "from": "Ana Souza",
      "fromOrg": "Horizonte Ltda.",
      "time": "10:24",
      "body": [
        "Olá,",
        "Quinta-feira às 15h funcionaria para a nossa reunião da semana que vem?",
        "Me avise o que for melhor para você."
      ],
      "replyTo": "Re: Data da nossa reunião",
      "send": "Enviar",
      "inline": "mando os arquivos amanhã"
    },
    "chat": {
      "app": "Chat",
      "channel": "projeto",
      "who": "Rafael Lima",
      "time": "16:02",
      "message": "Consegue compartilhar hoje os slides da reunião de amanhã?",
      "input": "Escreva uma mensagem",
      "send": "Enviar",
      "gist": "compartilho hoje até as 17h",
      "me": "Você"
    },
    "article": {
      "app": "Notícias",
      "section": "Tecnologia",
      "title": "Escrever e-mails é o uso mais comum da IA no trabalho",
      "paragraphs": [
        "Segundo uma pesquisa recente, cerca de 60% das pessoas que usam IA generativa no trabalho recorrem a ela para escrever e-mails e mensagens de chat. Em seguida vêm resumir documentos e traduzir, o que mostra que o uso se concentra na escrita.",
        "Ao mesmo tempo, os entrevistados citaram a preocupação de inserir informações confidenciais e o tempo gasto para conferir o resultado. Especialistas afirmam que é essencial que uma pessoa sempre leia o texto antes do envio e que se insira o mínimo de informação possível."
      ]
    },
    "sns": {
      "app": "Social",
      "placeholder": "O que está acontecendo?",
      "post": "Publicar",
      "draft": "Fim de semana fui no café novo. O latte estava bom. Quero voltar.",
      "instruction": "Deixe alegre e com emojis"
    },
    "steps": {
      "polite": "① Selecione → \"Mais educado\" → Aplicar",
      "snippet": "② Modelos de texto: \";hi\" + Tab",
      "inline": "③ \"//p texto\" + Tab reescreve na hora",
      "reply": "④ Crie a resposta para uma mensagem",
      "summary": "⑤ Resuma textos longos",
      "custom": "⑥ Reescreva com a sua própria instrução",
      "translate": "⑦ Traduza para o inglês"
    },
    "more": {
      "title": "E mais",
      "cards": [
        "Copie de novo pelo histórico",
        "Abra com o botão direito ou Alt+Shift+S",
        "Crie e edite suas predefinições",
        "20 idiomas, em qualquer campo de texto"
      ],
      "menu": "SendReady"
    },
    "cta": {
      "title": "Deixe o toque final com a IA.",
      "chips": [
        "Grátis",
        "Sem cadastro",
        "20 idiomas"
      ],
      "button": "Usar no Chrome",
      "note": "50 usos de IA por dia · Só o texto selecionado é enviado"
    },
    "trigger": ";hi"
  },
  "ru": {
    "hook": [
      "Этот ответ…",
      "точно можно так отправить?"
    ],
    "draft": "В четверг не могу. В пятницу могу.",
    "tagline": "Выделите, отшлифуйте, отправьте.",
    "mail": {
      "app": "Почта",
      "folder": "Входящие",
      "subject": "Дата нашей встречи",
      "from": "Анна Смирнова",
      "fromOrg": "ООО «Северный ветер»",
      "time": "10:24",
      "body": [
        "Здравствуйте!",
        "Удобно ли вам встретиться на следующей неделе в четверг в 15:00?",
        "Сообщите, пожалуйста, как вам удобнее."
      ],
      "replyTo": "Re: Дата нашей встречи",
      "send": "Отправить",
      "inline": "пришлю файлы завтра"
    },
    "chat": {
      "app": "Чат",
      "channel": "проект",
      "who": "Дмитрий Иванов",
      "time": "16:02",
      "message": "Сможешь сегодня скинуть слайды к завтрашней встрече?",
      "input": "Напишите сообщение",
      "send": "Отправить",
      "gist": "пришлю сегодня до 17:00",
      "me": "Вы"
    },
    "article": {
      "app": "Новости",
      "section": "Технологии",
      "title": "Чаще всего ИИ на работе используют для писем",
      "paragraphs": [
        "Согласно недавнему опросу, около 60% тех, кто использует генеративный ИИ на работе, пишут с его помощью письма и сообщения в чатах. Далее следуют краткое изложение документов и перевод: в основном ИИ применяют для работы с текстом.",
        "Вместе с тем опрошенные назвали опасения по поводу ввода конфиденциальных данных и время, которое уходит на проверку результата. Эксперты считают важным, чтобы человек всегда перечитывал текст перед отправкой, а вводимых данных было как можно меньше."
      ]
    },
    "sns": {
      "app": "Соцсеть",
      "placeholder": "Что нового?",
      "post": "Опубликовать",
      "draft": "На выходных сходил в новое кафе. Латте был хороший. Хочу сходить ещё.",
      "instruction": "Сделай весело и с эмодзи"
    },
    "steps": {
      "polite": "① Выделите → «Вежливее» → Применить",
      "snippet": "② Шаблоны: «;hi» + Tab",
      "inline": "③ «//p текст» + Tab — исправит прямо на месте",
      "reply": "④ Ответ на сообщение",
      "summary": "⑤ Кратко изложит длинный текст",
      "custom": "⑥ Перепишет по вашей инструкции",
      "translate": "⑦ Переведёт на английский"
    },
    "more": {
      "title": "А ещё",
      "cards": [
        "Копируйте снова из истории",
        "Открывается правым кликом или Alt+Shift+S",
        "Свои шаблоны — создавайте и меняйте",
        "20 языков, любое поле ввода"
      ],
      "menu": "SendReady"
    },
    "cta": {
      "title": "Финальную шлифовку доверьте ИИ.",
      "chips": [
        "Бесплатно",
        "Без регистрации",
        "20 языков"
      ],
      "button": "Установить",
      "note": "50 запросов к ИИ в день · Отправляется только выделенный текст"
    },
    "trigger": ";hi"
  },
  "tr": {
    "hook": [
      "O cevap…",
      "gerçekten böyle gönderilir mi?"
    ],
    "draft": "Perşembe olmaz. Cuma olur.",
    "tagline": "Seç, düzelt, gönder.",
    "mail": {
      "app": "Posta",
      "folder": "Gelen Kutusu",
      "subject": "Toplantı tarihimiz",
      "from": "Elif Yılmaz",
      "fromOrg": "Anadolu Ticaret A.Ş.",
      "time": "10:24",
      "body": [
        "Merhaba,",
        "Önümüzdeki haftaki toplantımız için perşembe saat 15.00 uygun olur mu?",
        "Size uyan zamanı bildirirseniz sevinirim."
      ],
      "replyTo": "Ynt: Toplantı tarihimiz",
      "send": "Gönder",
      "inline": "dosyaları yarın gönderirim"
    },
    "chat": {
      "app": "Sohbet",
      "channel": "proje",
      "who": "Mehmet Kaya",
      "time": "16:02",
      "message": "Yarınki toplantının slaytlarını bugün paylaşabilir misin?",
      "input": "Bir mesaj yazın",
      "send": "Gönder",
      "gist": "slaytları bugün 17.00'ye kadar ben paylaşırım",
      "me": "Siz"
    },
    "article": {
      "app": "Haberler",
      "section": "Teknoloji",
      "title": "İş yerinde yapay zekâ en çok e-posta yazmak için kullanılıyor",
      "paragraphs": [
        "Yakın tarihli bir ankete göre, işte üretken yapay zekâ kullananların yaklaşık yüzde 60'ı onu e-posta ve sohbet mesajı yazmak için kullanıyor. Bunu belge özetleme ve çeviri izliyor; kullanım ağırlıkla yazıya dayalı işlerde.",
        "Öte yandan katılımcılar gizli bilgileri girme konusundaki kaygılarını ve çıktıyı kontrol etmenin aldığı zamanı dile getirdi. Uzmanlar, metnin gönderilmeden önce mutlaka bir insan tarafından okunmasının ve girilen bilginin en aza indirilmesinin önemli olduğunu vurguluyor."
      ]
    },
    "sns": {
      "app": "Sosyal",
      "placeholder": "Neler oluyor?",
      "post": "Paylaş",
      "draft": "Hafta sonu yeni açılan kafeye gittim. Latte güzeldi. Yine gitmek istiyorum.",
      "instruction": "Emojilerle neşeli yap"
    },
    "steps": {
      "polite": "① Seç → \"Daha kibar\" → Uygula",
      "snippet": "② Hazır metinler: \";hi\" + Tab",
      "inline": "③ \"//p metin\" + Tab ile yerinde düzelt",
      "reply": "④ Gelen mesaja yanıt taslağı",
      "summary": "⑤ Uzun metni özetle",
      "custom": "⑥ Kendi talimatınla yeniden yaz",
      "translate": "⑦ Hemen İngilizceye çevir"
    },
    "more": {
      "title": "Dahası",
      "cards": [
        "Geçmişten tekrar kopyala",
        "Sağ tık veya Alt+Shift+S ile aç",
        "Kendi ön ayarlarını ekle ve düzenle",
        "20 dil, her metin alanında"
      ],
      "menu": "SendReady"
    },
    "cta": {
      "title": "Son dokunuşu yapay zekâya bırakın.",
      "chips": [
        "Ücretsiz",
        "Kayıt yok",
        "20 dil"
      ],
      "button": "Chrome'a ekle",
      "note": "Günde 50 yapay zekâ kullanımı · Yalnızca seçtiğiniz metin gönderilir"
    },
    "trigger": ";hi"
  },
  "zh": {
    "hook": [
      "这条回复，",
      "真的可以就这样发出去吗？"
    ],
    "draft": "周四没空，周五可以。",
    "tagline": "选中、润色、发送，就这么简单。",
    "mail": {
      "app": "邮件",
      "folder": "收件箱",
      "subject": "关于会议时间",
      "from": "王 丽",
      "fromOrg": "华信贸易有限公司",
      "time": "10:24",
      "body": [
        "您好，",
        "下周的会议定在周四下午3点，您看可以吗？",
        "请告知您方便的时间。"
      ],
      "replyTo": "回复：关于会议时间",
      "send": "发送",
      "inline": "资料明天发你"
    },
    "chat": {
      "app": "聊天",
      "channel": "项目",
      "who": "张 伟",
      "time": "16:02",
      "message": "明天开会的幻灯片，今天能发出来吗？",
      "input": "输入消息",
      "send": "发送",
      "gist": "我今天5点前发给你",
      "me": "你"
    },
    "article": {
      "app": "新闻",
      "section": "科技",
      "title": "职场使用生成式AI，写邮件居首位",
      "paragraphs": [
        "一项最新调查显示，在工作中使用生成式AI的人当中，约六成用它来撰写邮件和聊天消息。其次是总结资料和翻译，可见其用途主要集中在与文字相关的工作上。",
        "与此同时，受访者也提到了输入机密信息的顾虑，以及核对输出内容需要花费时间等问题。专家指出，发送前务必由人工通读，并尽量减少输入的信息，这一点十分重要。"
      ]
    },
    "sns": {
      "app": "社交",
      "placeholder": "有什么新鲜事？",
      "post": "发布",
      "draft": "周末去了新开的咖啡店。拿铁很好喝。还想再去。",
      "instruction": "加上表情，写得活泼一点"
    },
    "steps": {
      "polite": "① 选中 → “更礼貌” → 应用",
      "snippet": "② 快捷短语：“;hi” + Tab",
      "inline": "③ “//p 文字” + Tab，就地改写",
      "reply": "④ 为收到的消息生成回复",
      "summary": "⑤ 总结长篇文字",
      "custom": "⑥ 按你的指示改写",
      "translate": "⑦ 一键翻译成英文"
    },
    "more": {
      "title": "还有更多",
      "cards": [
        "从历史记录随时再次复制",
        "右键或 Alt+Shift+S 也能打开",
        "自由添加和编辑预设",
        "20 种语言，任意输入框可用"
      ],
      "menu": "SendReady"
    },
    "cta": {
      "title": "发送前的最后润色，交给 AI。",
      "chips": [
        "免费",
        "无需注册",
        "20 种语言"
      ],
      "button": "添加至 Chrome",
      "note": "AI 每天 50 次 · 只发送你选中的文字"
    },
    "trigger": ";hi"
  },
  "zh_TW": {
    "hook": [
      "這則回覆，",
      "真的可以就這樣送出嗎？"
    ],
    "draft": "週四不行。週五可以。",
    "tagline": "選取、潤飾、送出，就這麼簡單。",
    "mail": {
      "app": "郵件",
      "folder": "收件匣",
      "subject": "關於會議時間",
      "from": "林 怡君",
      "fromOrg": "台信貿易股份有限公司",
      "time": "10:24",
      "body": [
        "您好，",
        "下週的會議訂在週四下午3點，不知您是否方便？",
        "請告訴我您方便的時間。"
      ],
      "replyTo": "回覆：關於會議時間",
      "send": "傳送",
      "inline": "資料明天寄給你"
    },
    "chat": {
      "app": "聊天",
      "channel": "專案",
      "who": "陳 志明",
      "time": "16:02",
      "message": "明天開會的簡報，今天能先分享嗎？",
      "input": "輸入訊息",
      "send": "傳送",
      "gist": "我今天5點前分享給你",
      "me": "你"
    },
    "article": {
      "app": "新聞",
      "section": "科技",
      "title": "職場使用生成式AI，寫信居首",
      "paragraphs": [
        "一項最新調查顯示，在工作中使用生成式AI的人當中，約六成用來撰寫電子郵件與聊天訊息。其次是摘要資料與翻譯，可見用途集中在與文字相關的工作。",
        "另一方面，受訪者也提到輸入機密資訊的疑慮，以及確認輸出內容費時等問題。專家指出，送出前一定要由人親自讀過，並盡量減少輸入的資訊，這點非常重要。"
      ]
    },
    "sns": {
      "app": "社群",
      "placeholder": "有什麼新鮮事？",
      "post": "發佈",
      "draft": "週末去了新開的咖啡店。拿鐵很好喝。還想再去。",
      "instruction": "加上表情符號，寫得活潑一點"
    },
    "steps": {
      "polite": "① 選取 → 「更有禮貌」→ 套用",
      "snippet": "② 常用文字：「;hi」+ Tab",
      "inline": "③「//p 文字」+ Tab，當場改寫",
      "reply": "④ 為收到的訊息產生回覆",
      "summary": "⑤ 摘要長篇文字",
      "custom": "⑥ 依你的指示改寫",
      "translate": "⑦ 直接翻譯成英文"
    },
    "more": {
      "title": "還有更多",
      "cards": [
        "從歷史紀錄隨時再複製",
        "右鍵或 Alt+Shift+S 也能開啟",
        "自由新增與編輯預設",
        "20 種語言，任何輸入框都能用"
      ],
      "menu": "SendReady"
    },
    "cta": {
      "title": "送出前的最後潤飾，交給 AI。",
      "chips": [
        "免費",
        "免註冊",
        "20 種語言"
      ],
      "button": "加到 Chrome",
      "note": "AI 每天 50 次 · 只傳送你選取的文字"
    },
    "trigger": ";hi"
  },
  "ko": {
    "hook": [
      "그 답장,",
      "정말 이대로 보내도 될까요?"
    ],
    "draft": "목요일은 안 돼요. 금요일은 돼요.",
    "tagline": "선택하고, 다듬고, 보내기만 하세요.",
    "mail": {
      "app": "메일",
      "folder": "받은편지함",
      "subject": "회의 일정 문의",
      "from": "김 지은",
      "fromOrg": "한빛상사",
      "time": "10:24",
      "body": [
        "안녕하세요.",
        "다음 주 회의는 목요일 오후 3시가 어떠실까요?",
        "편하신 시간을 알려 주세요."
      ],
      "replyTo": "Re: 회의 일정 문의",
      "send": "보내기",
      "inline": "자료는 내일 보낼게요"
    },
    "chat": {
      "app": "채팅",
      "channel": "프로젝트",
      "who": "박 민수 부장",
      "time": "16:02",
      "message": "내일 회의 자료, 오늘 중으로 공유 가능할까?",
      "input": "메시지 입력",
      "send": "보내기",
      "gist": "제가 오늘 5시까지 공유할게요",
      "me": "나"
    },
    "article": {
      "app": "뉴스",
      "section": "테크",
      "title": "직장 내 생성형 AI 활용, 메일 작성이 가장 많아",
      "paragraphs": [
        "최근 조사에 따르면 업무에서 생성형 AI를 쓰는 사람 가운데 약 60%가 이메일과 채팅 메시지 작성에 활용한다고 답했다. 이어 자료 요약과 번역이 많아, 글쓰기와 관련된 업무에서의 활용이 두드러졌다.",
        "한편 기밀 정보를 입력하는 데 대한 불안과 결과를 확인하는 데 드는 시간 등의 과제도 지적됐다. 전문가들은 보내기 전에 반드시 사람이 다시 읽고, 입력하는 정보를 최소화하는 것이 중요하다고 강조했다."
      ]
    },
    "sns": {
      "app": "SNS",
      "placeholder": "무슨 일이 있나요?",
      "post": "게시",
      "draft": "주말에 새로 생긴 카페에 다녀왔다. 라떼가 맛있었다. 또 가고 싶다.",
      "instruction": "이모지를 넣어서 밝게"
    },
    "steps": {
      "polite": "① 선택 → '정중하게' → 적용",
      "snippet": "② 상용구는 ';hi' + Tab",
      "inline": "③ '//p 문장' + Tab으로 그 자리에서 변환",
      "reply": "④ 받은 메시지에 답장 작성",
      "summary": "⑤ 긴 글을 요약",
      "custom": "⑥ 원하는 지시로 다시 쓰기",
      "translate": "⑦ 바로 영어로 번역"
    },
    "more": {
      "title": "그 밖에도",
      "cards": [
        "생성 기록에서 언제든 다시 복사",
        "우클릭·Alt+Shift+S로도 열기",
        "프리셋을 자유롭게 등록·편집",
        "20개 언어, 어떤 입력란에서도"
      ],
      "menu": "SendReady"
    },
    "cta": {
      "title": "보내기 전 마지막 손질은 AI에게.",
      "chips": [
        "무료",
        "가입 불필요",
        "20개 언어"
      ],
      "button": "Chrome에 추가",
      "note": "AI는 하루 50회까지 · 선택한 글만 전송됩니다"
    },
    "trigger": ";hi"
  },
  "vi": {
    "hook": [
      "Câu trả lời đó…",
      "gửi như vậy có ổn không?"
    ],
    "draft": "Thứ Năm không được. Thứ Sáu thì được.",
    "tagline": "Chọn, chỉnh, gửi — thế thôi.",
    "mail": {
      "app": "Thư",
      "folder": "Hộp thư đến",
      "subject": "Lịch họp của chúng ta",
      "from": "Nguyễn Thu Hà",
      "fromOrg": "Công ty TNHH Sao Mai",
      "time": "10:24",
      "body": [
        "Chào anh,",
        "Cuộc họp tuần sau vào 15 giờ thứ Năm có tiện cho anh không?",
        "Anh cho tôi biết thời gian phù hợp nhé."
      ],
      "replyTo": "Re: Lịch họp của chúng ta",
      "send": "Gửi",
      "inline": "mai em sẽ gửi tài liệu"
    },
    "chat": {
      "app": "Chat",
      "channel": "dự-án",
      "who": "Trần Minh Quân",
      "time": "16:02",
      "message": "Slide cho buổi họp ngày mai, hôm nay em chia sẻ được không?",
      "input": "Nhập tin nhắn",
      "send": "Gửi",
      "gist": "em sẽ gửi trước 5 giờ chiều nay",
      "me": "Bạn"
    },
    "article": {
      "app": "Tin tức",
      "section": "Công nghệ",
      "title": "Soạn email là cách dùng AI phổ biến nhất nơi công sở",
      "paragraphs": [
        "Theo một khảo sát gần đây, khoảng 60% người dùng AI tạo sinh trong công việc sử dụng nó để soạn email và tin nhắn. Tiếp theo là tóm tắt tài liệu và dịch thuật, cho thấy AI chủ yếu được dùng cho các việc liên quan đến chữ viết.",
        "Bên cạnh đó, người được hỏi cũng lo ngại về việc nhập thông tin mật và thời gian cần để kiểm tra kết quả. Các chuyên gia cho rằng điều quan trọng là luôn có người đọc lại văn bản trước khi gửi và nhập ít thông tin nhất có thể."
      ]
    },
    "sns": {
      "app": "Mạng xã hội",
      "placeholder": "Bạn đang nghĩ gì?",
      "post": "Đăng",
      "draft": "Cuối tuần đi quán cà phê mới mở. Latte ngon. Muốn quay lại.",
      "instruction": "Viết vui tươi, thêm emoji"
    },
    "steps": {
      "polite": "① Chọn → \"Lịch sự hơn\" → Áp dụng",
      "snippet": "② Mẫu câu: \";hi\" + Tab",
      "inline": "③ \"//p nội dung\" + Tab để sửa ngay tại chỗ",
      "reply": "④ Soạn trả lời cho tin nhắn nhận được",
      "summary": "⑤ Tóm tắt văn bản dài",
      "custom": "⑥ Viết lại theo ý bạn",
      "translate": "⑦ Dịch ngay sang tiếng Anh"
    },
    "more": {
      "title": "Và còn nữa",
      "cards": [
        "Sao chép lại từ lịch sử",
        "Mở bằng chuột phải hoặc Alt+Shift+S",
        "Tự thêm và sửa mẫu có sẵn",
        "20 ngôn ngữ, mọi ô nhập liệu"
      ],
      "menu": "SendReady"
    },
    "cta": {
      "title": "Để AI chỉnh lần cuối trước khi gửi.",
      "chips": [
        "Miễn phí",
        "Không cần đăng ký",
        "20 ngôn ngữ"
      ],
      "button": "Thêm vào Chrome",
      "note": "AI 50 lần mỗi ngày · Chỉ gửi đoạn văn bạn chọn"
    },
    "trigger": ";hi"
  },
  "th": {
    "hook": [
      "ข้อความตอบกลับนี้",
      "ส่งแบบนี้ได้จริงเหรอ?"
    ],
    "draft": "วันพฤหัสไม่ได้ วันศุกร์ได้",
    "tagline": "เลือก ขัดเกลา แล้วส่งได้เลย",
    "mail": {
      "app": "อีเมล",
      "folder": "กล่องจดหมาย",
      "subject": "นัดวันประชุม",
      "from": "สุดารัตน์ ใจดี",
      "fromOrg": "บริษัท สยามเทรด จำกัด",
      "time": "10:24",
      "body": [
        "สวัสดีค่ะ",
        "ประชุมสัปดาห์หน้า วันพฤหัสบดีเวลา 15.00 น. สะดวกไหมคะ",
        "รบกวนแจ้งเวลาที่สะดวกด้วยนะคะ"
      ],
      "replyTo": "Re: นัดวันประชุม",
      "send": "ส่ง",
      "inline": "พรุ่งนี้จะส่งเอกสารให้"
    },
    "chat": {
      "app": "แชท",
      "channel": "โปรเจกต์",
      "who": "ผู้จัดการ สมชาย",
      "time": "16:02",
      "message": "สไลด์ประชุมพรุ่งนี้ แชร์ได้ภายในวันนี้ไหม",
      "input": "พิมพ์ข้อความ",
      "send": "ส่ง",
      "gist": "จะแชร์ให้ภายใน 5 โมงเย็นวันนี้",
      "me": "คุณ"
    },
    "article": {
      "app": "ข่าว",
      "section": "เทคโนโลยี",
      "title": "ใช้ AI ในที่ทำงาน งานเขียนอีเมลมาเป็นอันดับหนึ่ง",
      "paragraphs": [
        "ผลสำรวจล่าสุดพบว่า ราว 60% ของผู้ที่ใช้ AI แบบช่วยสร้างในการทำงาน ใช้เพื่อเขียนอีเมลและข้อความแชท รองลงมาคือการสรุปเอกสารและการแปล แสดงให้เห็นว่าการใช้งานส่วนใหญ่เกี่ยวกับงานเขียน",
        "ขณะเดียวกัน ผู้ตอบแบบสำรวจกังวลเรื่องการป้อนข้อมูลลับ และเวลาที่ต้องใช้ตรวจสอบผลลัพธ์ ผู้เชี่ยวชาญชี้ว่า สิ่งสำคัญคือต้องให้คนอ่านทวนก่อนส่งทุกครั้ง และป้อนข้อมูลให้น้อยที่สุดเท่าที่ทำได้"
      ]
    },
    "sns": {
      "app": "โซเชียล",
      "placeholder": "คุณกำลังคิดอะไรอยู่",
      "post": "โพสต์",
      "draft": "สุดสัปดาห์ไปคาเฟ่ที่เพิ่งเปิดใหม่ ลาเต้อร่อย อยากไปอีก",
      "instruction": "เขียนให้สดใส ใส่อีโมจิ"
    },
    "steps": {
      "polite": "① เลือก → \"สุภาพขึ้น\" → ใช้",
      "snippet": "② ข้อความสำเร็จรูป: \";hi\" + Tab",
      "inline": "③ \"//p ข้อความ\" + Tab แปลงได้ทันที",
      "reply": "④ ร่างคำตอบให้ข้อความที่ได้รับ",
      "summary": "⑤ สรุปข้อความยาว ๆ",
      "custom": "⑥ เขียนใหม่ตามคำสั่งของคุณ",
      "translate": "⑦ แปลเป็นภาษาอังกฤษทันที"
    },
    "more": {
      "title": "และอีกมาก",
      "cards": [
        "คัดลอกซ้ำจากประวัติได้ทุกเมื่อ",
        "เปิดด้วยคลิกขวาหรือ Alt+Shift+S",
        "เพิ่มและแก้ไขค่าที่ตั้งไว้ได้เอง",
        "20 ภาษา ใช้ได้ทุกช่องพิมพ์"
      ],
      "menu": "SendReady"
    },
    "cta": {
      "title": "ให้ AI ช่วยเกลารอบสุดท้ายก่อนส่ง",
      "chips": [
        "ฟรี",
        "ไม่ต้องสมัคร",
        "20 ภาษา"
      ],
      "button": "เพิ่มใน Chrome",
      "note": "ใช้ AI ได้วันละ 50 ครั้ง · ส่งเฉพาะข้อความที่เลือก"
    },
    "trigger": ";hi"
  },
  "id": {
    "hook": [
      "Balasan itu…",
      "yakin sudah siap dikirim?"
    ],
    "draft": "Kamis nggak bisa. Jumat bisa.",
    "tagline": "Pilih, rapikan, kirim.",
    "mail": {
      "app": "Email",
      "folder": "Kotak Masuk",
      "subject": "Jadwal rapat kita",
      "from": "Siti Rahma",
      "fromOrg": "PT Nusantara Jaya",
      "time": "10:24",
      "body": [
        "Halo,",
        "Apakah Kamis pukul 15.00 cocok untuk rapat kita minggu depan?",
        "Mohon kabari waktu yang sesuai."
      ],
      "replyTo": "Re: Jadwal rapat kita",
      "send": "Kirim",
      "inline": "file saya kirim besok"
    },
    "chat": {
      "app": "Chat",
      "channel": "proyek",
      "who": "Pak Budi",
      "time": "16:02",
      "message": "Slide untuk rapat besok bisa dibagikan hari ini?",
      "input": "Tulis pesan",
      "send": "Kirim",
      "gist": "saya bagikan hari ini sebelum jam 5 sore",
      "me": "Anda"
    },
    "article": {
      "app": "Berita",
      "section": "Teknologi",
      "title": "Menulis email jadi penggunaan AI terbanyak di kantor",
      "paragraphs": [
        "Menurut survei terbaru, sekitar 60% orang yang memakai AI generatif di tempat kerja menggunakannya untuk menulis email dan pesan chat. Berikutnya adalah meringkas dokumen dan menerjemahkan, menunjukkan bahwa penggunaannya berpusat pada tulisan.",
        "Di sisi lain, responden menyebut kekhawatiran memasukkan informasi rahasia serta waktu yang dibutuhkan untuk memeriksa hasilnya. Para ahli menilai penting agar teks selalu dibaca ulang oleh manusia sebelum dikirim dan informasi yang dimasukkan seminimal mungkin."
      ]
    },
    "sns": {
      "app": "Sosial",
      "placeholder": "Apa yang sedang terjadi?",
      "post": "Posting",
      "draft": "Akhir pekan ke kafe baru. Lattenya enak. Mau ke sana lagi.",
      "instruction": "Buat ceria dengan emoji"
    },
    "steps": {
      "polite": "① Pilih → \"Lebih Sopan\" → Terapkan",
      "snippet": "② Teks cepat: \";hi\" + Tab",
      "inline": "③ \"//p teks\" + Tab langsung diubah",
      "reply": "④ Buat balasan untuk pesan masuk",
      "summary": "⑤ Ringkas teks panjang",
      "custom": "⑥ Tulis ulang sesuai instruksimu",
      "translate": "⑦ Langsung terjemahkan ke Inggris"
    },
    "more": {
      "title": "Masih ada lagi",
      "cards": [
        "Salin lagi dari riwayat",
        "Buka dengan klik kanan atau Alt+Shift+S",
        "Tambah dan ubah preset sendiri",
        "20 bahasa, di kolom teks mana pun"
      ],
      "menu": "SendReady"
    },
    "cta": {
      "title": "Serahkan sentuhan akhir pada AI.",
      "chips": [
        "Gratis",
        "Tanpa daftar",
        "20 bahasa"
      ],
      "button": "Tambahkan ke Chrome",
      "note": "AI 50 kali sehari · Hanya teks yang dipilih yang dikirim"
    },
    "trigger": ";hi"
  },
  "hi": {
    "hook": [
      "वह जवाब…",
      "क्या सच में ऐसे ही भेज दें?"
    ],
    "draft": "गुरुवार नहीं हो पाएगा। शुक्रवार ठीक है।",
    "tagline": "चुनिए, निखारिए, भेजिए।",
    "mail": {
      "app": "मेल",
      "folder": "इनबॉक्स",
      "subject": "हमारी मीटिंग का समय",
      "from": "प्रिया शर्मा",
      "fromOrg": "सूर्या ट्रेडर्स प्रा. लि.",
      "time": "10:24",
      "body": [
        "नमस्ते,",
        "क्या अगले हफ़्ते की मीटिंग के लिए गुरुवार दोपहर 3 बजे ठीक रहेगा?",
        "कृपया बताइए कि आपके लिए कौन-सा समय सही है।"
      ],
      "replyTo": "Re: हमारी मीटिंग का समय",
      "send": "भेजें",
      "inline": "फ़ाइलें कल भेज दूँगा"
    },
    "chat": {
      "app": "चैट",
      "channel": "प्रोजेक्ट",
      "who": "राजेश वर्मा (मैनेजर)",
      "time": "16:02",
      "message": "कल की मीटिंग की स्लाइड्स आज शेयर कर पाओगे?",
      "input": "संदेश लिखें",
      "send": "भेजें",
      "gist": "मैं आज शाम 5 बजे तक शेयर कर दूँगा",
      "me": "आप"
    },
    "article": {
      "app": "समाचार",
      "section": "टेक्नोलॉजी",
      "title": "दफ़्तर में AI का सबसे ज़्यादा इस्तेमाल ईमेल लिखने में",
      "paragraphs": [
        "हाल के एक सर्वे के मुताबिक़, काम पर जनरेटिव AI इस्तेमाल करने वाले लगभग 60% लोग इसे ईमेल और चैट संदेश लिखने के लिए इस्तेमाल करते हैं। इसके बाद दस्तावेज़ों का सारांश और अनुवाद आते हैं, यानी इसका इस्तेमाल ज़्यादातर लिखने से जुड़े कामों में होता है।",
        "साथ ही, लोगों ने गोपनीय जानकारी डालने को लेकर चिंता और नतीजों को जाँचने में लगने वाले समय की बात भी कही। विशेषज्ञों का कहना है कि भेजने से पहले किसी व्यक्ति का टेक्स्ट को पढ़ना और कम से कम जानकारी डालना बहुत ज़रूरी है।"
      ]
    },
    "sns": {
      "app": "सोशल",
      "placeholder": "क्या चल रहा है?",
      "post": "पोस्ट करें",
      "draft": "वीकेंड पर नए कैफ़े गया। लाटे अच्छी थी। फिर जाना है।",
      "instruction": "इमोजी के साथ खुशनुमा बनाओ"
    },
    "steps": {
      "polite": "① चुनें → \"विनम्र बनाएँ\" → लागू करें",
      "snippet": "② स्निपेट: \";hi\" + Tab",
      "inline": "③ \"//p टेक्स्ट\" + Tab से वहीं बदलें",
      "reply": "④ आए संदेश का जवाब तैयार करें",
      "summary": "⑤ लंबे टेक्स्ट का सारांश",
      "custom": "⑥ अपने निर्देश से दोबारा लिखें",
      "translate": "⑦ तुरंत अंग्रेज़ी में अनुवाद"
    },
    "more": {
      "title": "और भी बहुत कुछ",
      "cards": [
        "इतिहास से कभी भी दोबारा कॉपी करें",
        "राइट-क्लिक या Alt+Shift+S से खोलें",
        "अपने प्रीसेट जोड़ें और बदलें",
        "20 भाषाएँ, किसी भी टेक्स्ट बॉक्स में"
      ],
      "menu": "SendReady"
    },
    "cta": {
      "title": "भेजने से पहले आख़िरी निखार AI से।",
      "chips": [
        "मुफ़्त",
        "साइन-अप नहीं",
        "20 भाषाएँ"
      ],
      "button": "Chrome में जोड़ें",
      "note": "रोज़ 50 बार AI · सिर्फ़ चुना हुआ टेक्स्ट भेजा जाता है"
    },
    "trigger": ";hi"
  },
  "bn": {
    "hook": [
      "এই উত্তরটা…",
      "সত্যিই কি এভাবে পাঠানো যায়?"
    ],
    "draft": "বৃহস্পতিবার হবে না। শুক্রবার হবে।",
    "tagline": "বাছাই করুন, ঘষেমেজে নিন, পাঠান।",
    "mail": {
      "app": "মেইল",
      "folder": "ইনবক্স",
      "subject": "আমাদের মিটিংয়ের সময়",
      "from": "অনন্যা সেন",
      "fromOrg": "রূপসা ট্রেডিং লিমিটেড",
      "time": "10:24",
      "body": [
        "নমস্কার,",
        "আগামী সপ্তাহের মিটিং বৃহস্পতিবার বিকেল ৩টায় হলে কি আপনার সুবিধা হবে?",
        "আপনার সুবিধামতো সময় জানাবেন।"
      ],
      "replyTo": "Re: আমাদের মিটিংয়ের সময়",
      "send": "পাঠান",
      "inline": "ফাইলগুলো কাল পাঠাব"
    },
    "chat": {
      "app": "চ্যাট",
      "channel": "প্রজেক্ট",
      "who": "সৌরভ দাস (ম্যানেজার)",
      "time": "16:02",
      "message": "কালকের মিটিংয়ের স্লাইডগুলো আজই শেয়ার করতে পারবে?",
      "input": "বার্তা লিখুন",
      "send": "পাঠান",
      "gist": "আমি আজ বিকেল ৫টার মধ্যে শেয়ার করব",
      "me": "আপনি"
    },
    "article": {
      "app": "খবর",
      "section": "প্রযুক্তি",
      "title": "অফিসে AI-এর সবচেয়ে বেশি ব্যবহার ইমেইল লেখায়",
      "paragraphs": [
        "সাম্প্রতিক এক জরিপে দেখা গেছে, কাজে জেনারেটিভ AI ব্যবহারকারীদের প্রায় ৬০% এটি ইমেইল ও চ্যাট বার্তা লিখতে ব্যবহার করেন। এরপর রয়েছে নথির সারসংক্ষেপ ও অনুবাদ, অর্থাৎ ব্যবহার মূলত লেখালেখির কাজকে ঘিরে।",
        "পাশাপাশি গোপন তথ্য দেওয়া নিয়ে উদ্বেগ এবং ফলাফল যাচাইয়ে সময় লাগার মতো সমস্যার কথাও উঠে এসেছে। বিশেষজ্ঞদের মতে, পাঠানোর আগে একজন মানুষের লেখাটি অবশ্যই পড়ে দেখা এবং যত কম সম্ভব তথ্য দেওয়া জরুরি।"
      ]
    },
    "sns": {
      "app": "সোশ্যাল",
      "placeholder": "কী হচ্ছে?",
      "post": "পোস্ট করুন",
      "draft": "সপ্তাহান্তে নতুন ক্যাফেতে গিয়েছিলাম। লাতে ভালো ছিল। আবার যেতে চাই।",
      "instruction": "ইমোজি দিয়ে প্রাণবন্ত করো"
    },
    "steps": {
      "polite": "① বাছাই → \"আরও ভদ্র\" → প্রয়োগ",
      "snippet": "② স্নিপেট: \";hi\" + Tab",
      "inline": "③ \"//p লেখা\" + Tab-এ সেখানেই বদলান",
      "reply": "④ আসা বার্তার উত্তর তৈরি করুন",
      "summary": "⑤ লম্বা লেখার সারসংক্ষেপ",
      "custom": "⑥ নিজের নির্দেশে নতুন করে লিখুন",
      "translate": "⑦ সঙ্গে সঙ্গে ইংরেজিতে অনুবাদ"
    },
    "more": {
      "title": "আরও আছে",
      "cards": [
        "ইতিহাস থেকে যখন খুশি আবার কপি",
        "রাইট-ক্লিক বা Alt+Shift+S দিয়ে খুলুন",
        "নিজের প্রিসেট যোগ ও সম্পাদনা",
        "২০টি ভাষা, যেকোনো টেক্সট বক্সে"
      ],
      "menu": "SendReady"
    },
    "cta": {
      "title": "পাঠানোর আগে শেষ ছোঁয়াটা দিক AI।",
      "chips": [
        "বিনামূল্যে",
        "সাইন-আপ নেই",
        "২০টি ভাষা"
      ],
      "button": "Chrome-এ যোগ করুন",
      "note": "দিনে ৫০ বার AI · শুধু বাছাই করা লেখাই পাঠানো হয়"
    },
    "trigger": ";hi"
  },
  "ar": {
    "hook": [
      "هذا الرد…",
      "هل أنت متأكد أنه جاهز للإرسال؟"
    ],
    "draft": "الخميس ما يناسبني. الجمعة تمام.",
    "tagline": "حدِّد، حسِّن، أرسِل.",
    "mail": {
      "app": "البريد",
      "folder": "الوارد",
      "subject": "موعد اجتماعنا",
      "from": "سارة الأحمد",
      "fromOrg": "شركة الأفق للتجارة",
      "time": "10:24",
      "body": [
        "مرحبًا،",
        "هل يناسبك يوم الخميس الساعة الثالثة عصرًا لاجتماعنا الأسبوع القادم؟",
        "أخبرني بالوقت المناسب لك."
      ],
      "replyTo": "رد: موعد اجتماعنا",
      "send": "إرسال",
      "inline": "بكرة أرسل الملفات"
    },
    "chat": {
      "app": "الدردشة",
      "channel": "المشروع",
      "who": "المدير خالد",
      "time": "16:02",
      "message": "تقدر تشارك شرائح اجتماع بكرة اليوم؟",
      "input": "اكتب رسالة",
      "send": "إرسال",
      "gist": "سأشاركها اليوم قبل الساعة 5",
      "me": "أنت"
    },
    "article": {
      "app": "الأخبار",
      "section": "التقنية",
      "title": "كتابة الرسائل الإلكترونية أكثر استخدامات الذكاء الاصطناعي في العمل",
      "paragraphs": [
        "وفقًا لاستطلاع حديث، يستخدم نحو 60% ممن يعتمدون على الذكاء الاصطناعي التوليدي في العمل هذه التقنية لكتابة الرسائل الإلكترونية ورسائل الدردشة. ويأتي بعد ذلك تلخيص المستندات والترجمة، ما يبيّن أن الاستخدام يتركز في الأعمال المتعلقة بالكتابة.",
        "في المقابل، أبدى المشاركون قلقهم من إدخال معلومات سرية ومن الوقت اللازم لمراجعة النتائج. ويرى الخبراء أنه من الضروري أن يقرأ شخصٌ النص دائمًا قبل إرساله، وأن تُدخَل أقل قدر ممكن من المعلومات."
      ]
    },
    "sns": {
      "app": "التواصل",
      "placeholder": "ماذا يحدث؟",
      "post": "نشر",
      "draft": "رحت المقهى الجديد في الويكند. اللاتيه كان حلو. أبغى أرجع له.",
      "instruction": "اجعله مرحًا مع رموز تعبيرية"
    },
    "steps": {
      "polite": "① حدِّد ← «كن مهذبًا» ← تطبيق",
      "snippet": "② نصوص جاهزة: ‎;hi‎ + Tab",
      "inline": "③ ‎//p‎ ثم النص + Tab للتحويل في مكانه",
      "reply": "④ اكتب ردًا على رسالة واردة",
      "summary": "⑤ لخِّص النصوص الطويلة",
      "custom": "⑥ أعد الصياغة بتعليماتك",
      "translate": "⑦ ترجمه إلى الإنجليزية فورًا"
    },
    "more": {
      "title": "والمزيد",
      "cards": [
        "انسخ مجددًا من السجل",
        "افتحه بالنقر الأيمن أو Alt+Shift+S",
        "أضف إعداداتك وعدّلها بحرية",
        "20 لغة، في أي حقل نصي"
      ],
      "menu": "SendReady"
    },
    "cta": {
      "title": "اترك اللمسة الأخيرة للذكاء الاصطناعي.",
      "chips": [
        "مجاني",
        "بدون تسجيل",
        "20 لغة"
      ],
      "button": "إضافة إلى Chrome",
      "note": "50 استخدامًا للذكاء الاصطناعي يوميًا · يُرسَل النص المحدد فقط"
    },
    "trigger": ";hi"
  }
};
