import { useState } from 'react'

export default function StorySection() {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <section className="story-section">
      <div className="story-container">
        <div className="story-header">
          <span className="story-ornament">✦ ✦ ✦</span>
          <h2 className="story-title">주하(Juha)는 어떤 친구일까?</h2>
          <p className="story-subtitle">이 갤러리는 어떤 마법으로 만들어졌을까?</p>
        </div>

        <div className="story-content">
          <div className="story-chapter">
            <div className="story-chapter-icon">🌟</div>
            <div className="story-text">
              <p>
                옛날 옛날, 꿈과 상상의 나라 어딘가에 <strong>주하(Juha)</strong>라는 이름의 
                작은 아이가 살았어요. 주하는 세상의 모든 아름다운 것들을 모아두고 싶어하는 
                호기심 많은 친구였답니다.
              </p>
            </div>
          </div>

          <div className="story-chapter">
            <div className="story-chapter-icon">🎨</div>
            <div className="story-text">
              <p>
                어느 날, 주하는 마법의 붓을 발견했어요. 이 붓으로 그림을 그리면, 
                그 속의 세계가 살아 움직이기 시작했지요! 숲속의 오두막에서는 따뜻한 
                불빛이 새어 나오고, 정원의 꽃들은 바람에 하늘하늘 춤을 추었어요.
              </p>
            </div>
          </div>

          {isExpanded && (
            <>
              <div className="story-chapter">
                <div className="story-chapter-icon">🏰</div>
                <div className="story-text">
                  <p>
                    주하는 이 마법 같은 그림들을 모두와 나누고 싶었어요. 
                    그래서 별빛 가루와 무지개 물감으로 특별한 갤러리를 만들었답니다. 
                    이곳이 바로 <strong>"주하의 경이로운 갤러리"</strong>예요!
                  </p>
                </div>
              </div>

              <div className="story-chapter">
                <div className="story-chapter-icon">🦋</div>
                <div className="story-text">
                  <p>
                    갤러리 곳곳에는 주하의 친구들이 숨어 있어요. 
                    장난꾸러기 요정, 졸린 고양이, 수줍은 토끼... 
                    그들을 찾아보는 것도 이 갤러리의 즐거움이랍니다!
                  </p>
                </div>
              </div>

              <div className="story-chapter">
                <div className="story-chapter-icon">💖</div>
                <div className="story-text">
                  <p>
                    주하는 이 갤러리에 찾아온 모든 친구들에게 말해요. <br />
                    <em>"네가 여기 와줘서 정말 기뻐! 마음에 드는 그림이 있다면 
                    하트를 눌러줘. 그러면 그 그림이 더 반짝반짝 빛나게 될 거야! ✨"</em>
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        <button
          className="story-expand-btn"
          onClick={() => setIsExpanded(prev => !prev)}
        >
          {isExpanded ? '이야기 접기 ▲' : '이야기 더 보기 ▼'}
        </button>
      </div>
    </section>
  )
}
