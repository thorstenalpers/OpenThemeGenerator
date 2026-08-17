import type { Translations } from './en';

export const de: Translations = {
	common: {
		mockHost: 'Läuft im Browser ohne Desktop-Host — alles, was Dateien anfasst, ist Attrappe.',
		copy: 'Kopieren',
		copied: 'Kopiert',
		light: 'Hell',
		dark: 'Dunkel',
		system: 'System',
		cancel: 'Abbrechen',
		close: 'Schließen'
	},
	sidebar: {
		sections: 'Bereiche',
		gallery: 'Galerie',
		studio: 'Studio',
		assistant: 'Assistent',
		exports: 'Export',
		settings: 'Einstellungen',
		info: 'Info',
		collapse: 'Seitenleiste einklappen',
		expand: 'Seitenleiste ausklappen',
		toLight: 'Zum hellen Modus wechseln',
		toDark: 'Zum dunklen Modus wechseln',
		editing: 'In Arbeit'
	},
	gallery: {
		title: 'Galerie',
		body: 'Farbe und Struktur, direkt übernehmbar. Ein geöffnetes Theme landet im Studio; das Original bleibt, wie es ist.',
		open: 'Im Studio öffnen',
		current: 'Im Studio',
		search: 'Nach Namen filtern',
		all: 'Alle',
		generated: 'Hier erzeugt',
		registry: 'Von tweakcn',
		templates: 'Vorlagen',
		empty: 'Nichts passt zu diesem Filter.',
		counted: (shown: number, total: number) => `${shown} von ${total}`,
		belowAA: (count: number) => `${count} unter 4,5:1`,
		more: (count: number) => `Weitere ${count} zeigen`,
		sortedBy: 'Sortiert nach',
		layoutGrid: 'Zwei pro Zeile',
		layoutSingle: 'Eine pro Zeile',
		layoutList: 'Detailliste',
		columnName: 'Name',
		columnSidebar: 'Seitenleiste',
		columnReadability: 'Lesbarkeit',
		columnAdded: 'Hinzugefügt',
		columnSource: 'Quelle',
		columnCurated: 'Kuratiert'
	},
	studio: {
		title: 'Studio',
		body: 'Alles leitet sich aus der Grundfarbe ab. Ein direkt geändertes Token folgt dem Rezept nicht mehr; Zurücksetzen stellt das ganze Theme so wieder her, wie es geöffnet wurde.',
		colour: 'Farbe',
		layout: 'Layout',
		layoutBody: 'Die Form der Seite, nicht die Palette. Das wirkt auf die ganze App auf einmal.',
		name: 'Name',
		seed: 'Grundfarbe',
		density: 'Dichte',
		densities: { compact: 'Kompakt', normal: 'Normal', comfortable: 'Großzügig' },
		borderWidth: 'Rahmenstärke',
		elevation: 'Tiefe',
		elevations: { none: 'Flach', subtle: 'Dezent', soft: 'Weich', lifted: 'Abgehoben' },
		sidebarStyle: 'Seitenleisten-Design',
		iconColor: 'Seitenleisten-Icons',
		iconColors: {
			mono: 'Einfarbig wie der Text',
			system: 'Semantische Standards (blau, grün, …)'
		},
		collapse: 'Seitenleiste in der Vorschau einklappen',
		sidebarWidth: 'Seitenleistenbreite',
		sidebarRail: 'Eingeklappte Seitenleiste',
		contentWidth: 'Inhaltsbreite',
		sidebarTone: 'Seitenleisten-Ton',
		sidebarTones: { flush: 'Bündig mit der Seite', tinted: 'Getönt', contrast: 'Abgesetzt' },
		exportTheme: 'Exportieren…',
		surfaceApp: 'App',
		surfaceLanding: 'Landingpage',
		surfaceSpace: 'Farbraum',
		spaceHint:
			'Jedes Token in OKLCH: Höhe ist Helligkeit, Abstand zur Achse ist Chroma, Winkel darum ist der Farbton. Der Schnitt zeigt, was sRGB im Markenton und seinem Gegenüber noch darstellen kann. Ziehen dreht, Scrollen zoomt, Zeigen benennt eine Kugel.',
		spaceUnavailable: 'Dieses Webview hat kein WebGL, der Farbraum lässt sich nicht zeichnen.',
		closeTab: 'Schließen',
		basedOn: (name: string) => `basiert auf ${name}`,
		changes: 'Manuelle Änderungen',
		changesNone: 'Seit dem Öffnen unverändert.',
		changesFrom: 'von',
		harmony: 'Diagramm-Harmonie',
		harmonies: {
			mono: 'Ein Farbton',
			analogous: 'Benachbarte Farbtöne',
			complementary: 'Gegenüberliegende Farbtöne',
			triad: 'Dreiteilung'
		},
		contrast: 'Kontrast',
		contrasts: { soft: 'Weich', normal: 'Normal', high: 'Hoch' },
		neutralChroma: 'Grau-Tönung',
		accentTint: 'Akzent-Tönung',
		radius: 'Eckenradius',
		lightBackground: 'Heller Hintergrund',
		darkBackground: 'Dunkler Hintergrund',
		reset: 'Zurücksetzen',
		randomise: 'Zufällige Grundfarbe',
		tokens: 'Tokens',
		preview: 'Vorschau',
		lowContrast: (ratio: string) => `${ratio}:1 — unter den 4,5:1, die Fließtext braucht`,
		edited: 'Von Hand geändert',
		revert: 'Auf das Rezept zurücksetzen'
	},
	exports: {
		title: 'Export',
		body: 'Dasselbe Theme in der Form, die das Zielprojekt schon spricht.',
		format: 'Format',
		colorSpace: 'Farbraum',
		oklch: 'OKLCH',
		hex: 'Hex',
		includeExtras: 'success und warning mitliefern',
		includeExtrasBody:
			'Nicht Teil des shadcn-Satzes. Aus, wenn das Zielprojekt sie nie deklariert.',
		includeReadme: 'README beilegen',
		includeReadmeBody:
			'Installationsanleitung und die strukturellen Entscheidungen — für den, der den Ordner öffnet.',
		files: 'Dateien',
		writeTo: 'In einen Ordner schreiben…',
		written: (count: number, where: string) =>
			`${count} ${count === 1 ? 'Datei' : 'Dateien'} nach ${where} geschrieben`,
		reveal: 'Im Dateimanager zeigen',
		usage: 'Verwendung'
	},
	chat: {
		title: 'Assistent',
		body: 'Beschreibe das Theme in Worten. Die Antwort wird als Theme gelesen und landet im Studio.',
		placeholder: 'Ein ruhiges Schieferblau für ein Entwicklerwerkzeug, wenig Kontrast, enge Ecken…',
		send: 'Senden',
		thinking: 'Denkt nach…',
		attach: 'Projekt anhängen…',
		attachBody:
			'Liest die Theme-relevanten Dateien, damit die Antwort zum Projekt passt statt zu einer Vermutung darüber.',
		import: 'Projekt importieren…',
		importBody:
			'Liest das Aussehen, das ein Projekt schon hat, und drückt es als Theme aus. Hier anpassen, exportieren — und das Projekt kann es zurücknehmen.',
		importing: (name: string) => `Importiere das Theme, das ${name} bereits verwendet.`,
		attached: (count: number) => `${count} ${count === 1 ? 'Datei' : 'Dateien'} angehängt`,
		detach: 'Lösen',
		clear: 'Verlauf leeren',
		apply: 'Im Studio öffnen',
		noTheme: 'Kein Theme in dieser Antwort — der Text steht unverändert oben.',
		you: 'Du',
		assistant: 'Assistent',
		basedOn: 'Schickt das aktuelle Theme mit, damit „mach es wärmer“ eine Grundlage hat.'
	},
	settings: {
		title: 'Einstellungen',
		appearance: 'Darstellung',
		appearanceBody: 'Der Modus, in dem diese App selbst gezeichnet wird.',
		language: 'Sprache',
		languageBody: 'Die Sprache der Oberfläche. Token-Namen werden nie übersetzt.',
		applyToApp: 'App im bearbeiteten Theme zeichnen',
		applyToAppBody:
			'Ein Theme lässt sich von innen leichter beurteilen als an einer Farbfläche daneben.',
		tabClose: 'Schließen-Symbole an den offenen Themes',
		tabCloseBody:
			'Das × neben jedem Theme unter Studio. Ohne es wird ein Tab über seinen Tab geschlossen.',
		assistant: 'Assistent',
		assistantBody: 'Wohin die Theme-Beschreibungen gehen.',
		sourceCliLabel: 'Lokale claude-Binary',
		sourceCliDetail:
			'Führt Claude Code auf diesem Rechner aus. Es verlässt nichts die Maschine, was die Binary nicht ohnehin sendet.',
		sourceAnthropicLabel: 'api.anthropic.com',
		sourceAnthropicDetail:
			'Eine gehostete Anfrage, mit dem Schlüssel in der Windows-Anmeldeinformationsverwaltung.',
		found: 'Gefunden',
		keyStored: 'Schlüssel gespeichert',
		apiKey: 'API-Schlüssel',
		store: 'Speichern',
		stored: 'Gespeichert.',
		keyNote:
			'Liegt in der Anmeldeinformationsverwaltung und wird nie in dieses Fenster zurückgelesen.'
	},
	info: {
		title: 'Info',
		body: 'Ein Theme-Generator für shadcn und für alles andere, das CSS-Custom-Properties liest.',
		tokens: 'Tokens',
		tokensBody:
			'Der shadcn-Satz, wie shadcn-svelte und shadcn/ui ihn ausliefern, dazu success, warning und fünf Diagramm-Plätze. Ein Projekt, das weniger deklariert, ignoriert den Rest einfach.',
		formats: 'Formate',
		reference: 'Referenzprojekt',
		referenceBody:
			'reference/ in diesem Repository ist eine Seite ganz ohne Framework. Sie liest den Plain-CSS-Export und ist der kürzeste Beweis, dass ein Theme von hier auch außerhalb von Svelte funktioniert.',
		licence: 'MIT'
	}
};
