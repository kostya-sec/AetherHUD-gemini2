export interface GlobalFormatTag {
  id: string;
  name: string;
  color: string;
}

export interface GlobalMediaType {
  id: string;
  name: string;
}

export interface TaxonomySubCategory {
  id: string;
  name: string;
  l3_preset_tags: string[];
}

export interface TaxonomyCategory {
  id: string;
  name: string;
  icon: string;
  children: TaxonomySubCategory[];
}

export interface TaxonomyData {
  $schema?: string;
  version?: string;
  meta?: {
    description: string;
  };
  global_l3_tags: {
    format_tags: GlobalFormatTag[];
    media_types: GlobalMediaType[];
  };
  taxonomy: TaxonomyCategory[];
}

export interface ResourceRecord {
  id: string;
  title: string;
  url?: string;
  snippet: string;
  l1: string;
  l1_name: string;
  l2: string;
  l2_name: string;
  format_tag: string;
  format_tag_name: string;
  media_type: string;
  tags: string[];
  source: 'manual' | 'webhook' | 'feishu_sync' | 'shortcut' | string;
  author?: string;
  pinned?: boolean;
  created_at: string;
  status: 'pending' | 'archived';
  notes?: string;
}

export type FilterLogic = 'AND' | 'OR';
