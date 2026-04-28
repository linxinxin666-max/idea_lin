export interface Persona {
  id: string;
  name: string;
  description: string;
  icon: string;
  tone: string;
}

export interface ContentType {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface GeneratedContent {
  text: string;
  tags: string[];
}
