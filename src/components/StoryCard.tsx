import { Heart, Languages, MapPin, Play, Send, Sparkles, Volume2, X } from "lucide-react";
import { useState } from "react";
import type { AppState, Comment, PublicUser, Story } from "../types";

const themeText: Record<Story["theme"], string> = {
  sun: "太阳",
  flood: "洪水",
  fire: "火",
  dragon: "龙",
  love: "爱情",
  moon: "月亮",
  underworld: "冥界",
  hero: "英雄",
  creation: "创世"
};

const eraText: Record<Story["era"], string> = {
  ancient: "远古",
  classical: "古典",
  medieval: "中世纪",
  modern: "近现代"
};

interface StoryCardProps {
  story: Story;
  related: Story[];
  comments: Comment[];
  state: AppState;
  currentUser: PublicUser | null;
  language: "zh" | "en";
  onClose: () => void;
  onSelectStory: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onLoginClick: () => void;
  onSubmitComment: (body: string) => Promise<void>;
}

export function StoryCard({
  story,
  related,
  comments,
  state,
  currentUser,
  language,
  onClose,
  onSelectStory,
  onToggleFavorite,
  onLoginClick,
  onSubmitComment
}: StoryCardProps) {
  const [commentText, setCommentText] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);
  const isFavorite = state.favoriteIds.includes(story.id);
  const title = language === "zh" ? story.titleZh : story.titleEn;
  const summary = language === "zh" ? story.summaryZh : story.summaryEn;
  const speakStory = () => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(`${title}。${summary}`);
    utterance.lang = language === "zh" ? "zh-CN" : "en-US";
    utterance.rate = 0.92;
    window.speechSynthesis.speak(utterance);
  };
  const submitComment = async () => {
    if (!commentText.trim()) return;
    setCommentBusy(true);
    await onSubmitComment(commentText);
    setCommentText("");
    setCommentBusy(false);
  };

  return (
    <article className="story-card">
      <button className="close-button" onClick={onClose} type="button">
        <X size={18} />
      </button>
      <img alt={title} className="story-image" src={story.imageUrl} />
      <div className="story-content">
        <div className="story-kicker">
          <MapPin size={15} />
          {story.country} / {story.region}
        </div>
        <h2>
          <span>{story.icon}</span>
          {title}
        </h2>
        <div className="tag-row">
          <span>{themeText[story.theme]}</span>
          <span>{eraText[story.era]}</span>
          <span>{story.countryEn}</span>
        </div>
        <p>{summary}</p>

        <div className="story-actions">
          <button className="primary-action" onClick={speakStory} type="button">
            <Play size={16} />
            播放故事
          </button>
          <button className="ghost-action" onClick={speakStory} type="button">
            <Volume2 size={16} />
            朗读
          </button>
          <button className={`ghost-action ${isFavorite ? "favorite" : ""}`} onClick={() => onToggleFavorite(story.id)} type="button">
            <Heart fill={isFavorite ? "currentColor" : "none"} size={16} />
            收藏
          </button>
          <button className="ghost-action" type="button">
            <Languages size={16} />
            {language === "zh" ? "中文" : "English"}
          </button>
        </div>

        {related.length > 0 && (
          <div className="related-panel">
            <div className="related-title">
              <Sparkles size={15} />
              相似神话
            </div>
            <div className="related-list">
              {related.slice(0, 4).map((item) => (
                <button key={item.id} onClick={() => onSelectStory(item.id)} type="button">
                  <span>{item.icon}</span>
                  <strong>{language === "zh" ? item.titleZh : item.titleEn}</strong>
                  <small>{item.country}</small>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="comments-panel">
          <div className="comments-title">
            <Sparkles size={15} />
            公开评论
            <span>{comments.length}</span>
          </div>
          {currentUser ? (
            <div className="comment-editor">
              <textarea
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
                placeholder={`以 ${currentUser.displayName} 的身份发表评论`}
                maxLength={500}
              />
              <button onClick={submitComment} disabled={commentBusy || !commentText.trim()} type="button">
                <Send size={15} />
                发送
              </button>
            </div>
          ) : (
            <button className="login-to-comment" onClick={onLoginClick} type="button">
              登录后评论，所有人都能看到
            </button>
          )}
          <div className="comment-list">
            {comments.length === 0 ? (
              <p>还没有评论，可以做第一个补充故事视角的人。</p>
            ) : (
              comments.map((comment) => (
                <article key={comment.id}>
                  <strong>{comment.displayName}</strong>
                  <time>{new Date(comment.createdAt).toLocaleString()}</time>
                  <p>{comment.body}</p>
                </article>
              ))
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
