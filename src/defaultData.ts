import { GalleryCard } from './types'

export const DEFAULT_CATEGORIES = ['풍경', '자연', '일상', '공간', '예술', '기타']

export const defaultCards: GalleryCard[] = [
  {
    id: '1',
    title: '숲속의 오두막',
    description: '깊은 숲 속에 자리한 작은 오두막. 따뜻한 불빛이 창문을 통해 새어 나옵니다.',
    mediaUrl: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=600&h=400&fit=crop',
    mediaType: 'image',
    category: '풍경',
    createdAt: '2026-01-15',
  },
  {
    id: '2',
    title: '마법의 정원',
    description: '색색의 꽃들이 피어난 비밀 정원. 나비들이 춤을 추고 있습니다.',
    mediaUrl: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=600&h=400&fit=crop',
    mediaType: 'image',
    category: '자연',
    createdAt: '2026-02-10',
  },
  {
    id: '3',
    title: '별이 빛나는 밤',
    description: '수천 개의 별이 밤하늘을 수놓은 고요한 밤의 풍경입니다.',
    mediaUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&h=400&fit=crop',
    mediaType: 'image',
    category: '풍경',
    createdAt: '2026-02-20',
  },
  {
    id: '4',
    title: '고양이의 낮잠',
    description: '창가에서 햇살을 받으며 평화로이 잠든 고양이.',
    mediaUrl: 'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=600&h=400&fit=crop',
    mediaType: 'image',
    category: '일상',
    createdAt: '2026-03-05',
  },
  {
    id: '5',
    title: '빈티지 책방',
    description: '세월의 향기가 묻어나는 오래된 책들이 가득한 작은 서점.',
    mediaUrl: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=600&h=400&fit=crop',
    mediaType: 'image',
    category: '공간',
    createdAt: '2026-03-18',
  },
  {
    id: '6',
    title: '호수 위의 안개',
    description: '이른 아침, 호수 위로 부드럽게 내려앉은 안개의 모습.',
    mediaUrl: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=600&h=400&fit=crop',
    mediaType: 'image',
    category: '풍경',
    createdAt: '2026-04-01',
  },
]
