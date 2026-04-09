import { useState } from 'react'

interface Question {
  text: string
  options: { label: string; scores: number[] }[]
}

interface Result {
  title: string
  emoji: string
  desc: string
  color: string
}

const QUESTIONS: Question[] = [
  {
    text: '1. 주말에 가장 하고 싶은 일은?',
    options: [
      { label: '🌄 예쁜 풍경을 보러 산책 가기', scores: [2, 0, 0, 1] },
      { label: '🎨 집에서 그림 그리며 보내기', scores: [0, 2, 1, 0] },
      { label: '🐾 귀여운 동물과 놀기', scores: [0, 0, 2, 1] },
      { label: '📚 아늑한 카페에서 책 읽기', scores: [1, 1, 0, 2] },
    ],
  },
  {
    text: '2. 마법의 힘을 하나 가질 수 있다면?',
    options: [
      { label: '🌈 무지개를 만드는 능력', scores: [2, 1, 0, 0] },
      { label: '🖌️ 그린 그림이 살아 움직이는 능력', scores: [0, 2, 1, 0] },
      { label: '🗣️ 동물과 대화하는 능력', scores: [0, 0, 2, 1] },
      { label: '📖 책 속으로 들어갈 수 있는 능력', scores: [1, 0, 0, 2] },
    ],
  },
  {
    text: '3. 친구에게 선물할 때 고르는 기준은?',
    options: [
      { label: '🌸 직접 찍은 예쁜 사진이나 풍경엽서', scores: [2, 0, 0, 1] },
      { label: '🎁 직접 만든 손그림 카드', scores: [0, 2, 1, 0] },
      { label: '🧸 귀여운 인형이나 캐릭터 상품', scores: [0, 1, 2, 0] },
      { label: '📗 마음을 담은 동화책', scores: [1, 0, 0, 2] },
    ],
  },
  {
    text: '4. 주하의 갤러리에 들어서면 가장 먼저 눈길이 가는 곳은?',
    options: [
      { label: '🏔️ 하늘과 자연을 담은 풍경 그림', scores: [2, 0, 0, 0] },
      { label: '🎨 화려한 색감의 추상 예술', scores: [0, 2, 0, 1] },
      { label: '🐱 귀여운 동물 캐릭터 그림', scores: [0, 0, 2, 0] },
      { label: '🏰 이야기가 숨어 있는 판타지 그림', scores: [0, 1, 0, 2] },
    ],
  },
]

const RESULTS: Result[] = [
  {
    title: '🌄 자연을 사랑하는 풍경 탐험가',
    emoji: '🌅',
    desc: '너는 자연의 아름다움에 감동받는 감성 풍경 탐험가야! 숲속의 오두막이나 호수 위의 안개 같은 고요하고 아름다운 장면에 마음이 끌려. 주하의 갤러리에서는 풍경 작품들이 너를 기다리고 있어!',
    color: '#4A9B7F',
  },
  {
    title: '🎨 빛나는 색채의 예술가',
    emoji: '🖌️',
    desc: '너는 세상을 독창적인 눈으로 바라보는 예술가 타입이야! 색을 섞고, 감정을 표현하는 걸 좋아하지? 마법의 정원처럼 화려하고 독특한 작품들이 너의 영혼을 울릴 거야!',
    color: '#C4A265',
  },
  {
    title: '🐾 따뜻한 마음의 동물 친구',
    emoji: '🐱',
    desc: '너는 동물들의 귀여움에 녹아내리는 따뜻한 마음의 소유자야! 고양이의 낮잠 같은 포근한 일상 속 모습에 행복을 느끼지. 주하의 갤러리에서 귀여운 동물 친구들을 만나봐!',
    color: '#E8A0BF',
  },
  {
    title: '📖 이야기 속 모험가',
    emoji: '🏰',
    desc: '너는 상상력이 풍부한 이야기꾼이야! 동화 같은 세계에 빠져들고, 신비로운 모험을 꿈꾸지? 별이 빛나는 밤처럼 신비로운 작품들이 너의 모험심을 자극할 거야!',
    color: '#6B5B95',
  },
]

export default function Quiz() {
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState(0) // 0~3: questions, 4: result
  const [scores, setScores] = useState([0, 0, 0, 0])

  const handleAnswer = (optionScores: number[]) => {
    const newScores = scores.map((s, i) => s + optionScores[i])
    setScores(newScores)
    setStep(prev => prev + 1)
  }

  const getResult = () => {
    const maxIdx = scores.indexOf(Math.max(...scores))
    return RESULTS[maxIdx]
  }

  const reset = () => {
    setStep(0)
    setScores([0, 0, 0, 0])
  }

  if (!isOpen) {
    return (
      <button className="quiz-open-btn" onClick={() => setIsOpen(true)}>
        <span className="quiz-open-icon">🔮</span>
        <span className="quiz-open-text">나와 어울리는 그림은?</span>
      </button>
    )
  }

  return (
    <div className="modal-backdrop z-editor" onClick={() => { setIsOpen(false); reset() }}>
      <div className="modal quiz-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={() => { setIsOpen(false); reset() }}>&times;</button>

        {/* 진행률 */}
        {step < QUESTIONS.length && (
          <div className="quiz-progress">
            {QUESTIONS.map((_, i) => (
              <div key={i} className={`quiz-dot ${i <= step ? 'active' : ''}`} />
            ))}
          </div>
        )}

        {step < QUESTIONS.length ? (
          /* 질문 */
          <div className="quiz-question-wrap">
            <h2 className="quiz-question">{QUESTIONS[step].text}</h2>
            <div className="quiz-options">
              {QUESTIONS[step].options.map((opt, i) => (
                <button
                  key={i}
                  className="quiz-option"
                  onClick={() => handleAnswer(opt.scores)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* 결과 */
          <div className="quiz-result-wrap">
            <div className="quiz-result-emoji">{getResult().emoji}</div>
            <h2 className="quiz-result-title" style={{ color: getResult().color }}>
              {getResult().title}
            </h2>
            <p className="quiz-result-desc">{getResult().desc}</p>
            <div className="quiz-result-actions">
              <button className="btn-secondary" onClick={reset}>다시 하기 🔄</button>
              <button className="btn-primary" onClick={() => { setIsOpen(false); reset() }}>
                갤러리 구경하기 🎨
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
