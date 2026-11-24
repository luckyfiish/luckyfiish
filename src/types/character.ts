export type MainTab = 'nhan-vat' | 'vong-quay' | 'thu-vien' | 'fiish';

export type CharacterGroup = 'Chính tuyến' | 'Phụ bản' | 'Tự tạo';
export type CharacterGender = 'Nữ' | 'Nam' | 'Khác';

export interface CharacterProfile {
  id: string;
  code: string;
  name: string;
  age: string;
  gender: CharacterGender;
  role: string;
  group: CharacterGroup;
  tags: string[];
  appearance: string;
  backstory: string;
  unlockLink: string;
  linkPassword: string;
  passwordHint?: string;
  link: string;
  linkLabel: string;
  portraitUrl: string;
  galleryImages?: string[];
  createdAt: number;
  isRare?: boolean;
}

export interface CharacterComment {
  id: string;
  characterId?: string;
  authorUid?: string;
  author: string;
  content: string;
  likesCount: number;
  createdAt: number;
}

export interface SpinWheelResult {
  segmentLabel: string;
  rewardKind: 'character-pack' | 'image-pack' | 'rare-character-pack' | 'clover' | 'multi';
  cloverGain?: number;
  items: Array<{
    id: string;
    character?: CharacterProfile;
    cloverGain?: number;
    isRare: boolean;
    label: string;
  }>;
}
