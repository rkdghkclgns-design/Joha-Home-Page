import { GalleryCard } from './types'

const BASE = import.meta.env.BASE_URL

export const DEFAULT_CATEGORIES = ['풍경', '자연', '일상', '공간', '예술', '기타']

export const defaultCards: GalleryCard[] = [
  {
    id: '1',
    title: '숲속의 오두막',
    description: '깊은 숲 속에 자리한 작은 오두막. 따뜻한 불빛이 창문을 통해 새어 나옵니다.',
    mediaUrl: `${BASE}images/cabin.png`,
    mediaType: 'image',
    mediaItems: [{ url: `${BASE}images/cabin.png`, type: 'image' }],
    category: '풍경',
    createdAt: '2026-01-15',
    likes: 0,
  },
  {
    id: '2',
    title: '마법의 정원',
    description: '색색의 꽃들이 피어난 비밀 정원. 나비들이 춤을 추고 있습니다.',
    mediaUrl: `${BASE}images/garden.png`,
    mediaType: 'image',
    mediaItems: [{ url: `${BASE}images/garden.png`, type: 'image' }],
    category: '자연',
    createdAt: '2026-02-10',
    likes: 0,
  },
  {
    id: '3',
    title: '별이 빛나는 밤',
    description: '수천 개의 별이 밤하늘을 수놓은 고요한 밤의 풍경입니다.',
    mediaUrl: `${BASE}images/starry.png`,
    mediaType: 'image',
    mediaItems: [{ url: `${BASE}images/starry.png`, type: 'image' }],
    category: '풍경',
    createdAt: '2026-02-20',
    likes: 0,
  },
  {
    id: '4',
    title: '고양이의 낮잠',
    description: '창가에서 햇살을 받으며 평화로이 잠든 고양이.',
    mediaUrl: `${BASE}images/cat.png`,
    mediaType: 'image',
    mediaItems: [{ url: `${BASE}images/cat.png`, type: 'image' }],
    category: '일상',
    createdAt: '2026-03-05',
    likes: 0,
  },
  {
    id: '5',
    title: '빈티지 책방',
    description: '세월의 향기가 묻어나는 오래된 책들이 가득한 작은 서점.',
    mediaUrl: `${BASE}images/bookshop.png`,
    mediaType: 'image',
    mediaItems: [{ url: `${BASE}images/bookshop.png`, type: 'image' }],
    category: '공간',
    createdAt: '2026-03-18',
    likes: 0,
  },
  {
    id: '6',
    title: '호수 위의 안개',
    description: '이른 아침, 호수 위로 부드럽게 내려앉은 안개의 모습.',
    mediaUrl: `${BASE}images/lake.png`,
    mediaType: 'image',
    mediaItems: [{ url: `${BASE}images/lake.png`, type: 'image' }],
    category: '풍경',
    createdAt: '2026-04-01',
    likes: 0,
  },
]
