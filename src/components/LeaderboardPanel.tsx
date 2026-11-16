import { User } from 'firebase/auth';
import { Check, Gift, LogIn, LogOut, Send, Trophy, Upload, X } from 'lucide-react';
import { useState } from 'react';
import { YUZU_GIFT_AMOUNT } from '../game/firebase';
import { DIFFICULTY_CONFIGS, FUR_OPTIONS } from '../game/skins';
import { GlobalLeaderboardEntry, YuzuGift } from '../game/types';

interface LeaderboardPanelProps {
  entries: GlobalLeaderboardEntry[];
  loading: boolean;
  errorMessage: string | null;
  user: User | null;
  personalEntry: GlobalLeaderboardEntry | null;
  localBestScore: number;
  submitting: boolean;
  authBusy: boolean;
  todaySentGift: YuzuGift | null;
  incomingGifts: YuzuGift[];
  onSignIn: () => void;
  onSignOut: () => void;
  onSyncLocalBest: () => void;
  onSendYuzuGift: (
    recipient: GlobalLeaderboardEntry,
    message: string
  ) => Promise<{ ok: boolean; error?: string }>;
  onClaimYuzuGift: (gift: YuzuGift) => Promise<void>;
}

export function LeaderboardPanel({
  entries,
  loading,
  errorMessage,
  user,
  personalEntry,
  localBestScore,
  submitting,
  authBusy,
  todaySentGift,
  incomingGifts,
  onSignIn,
  onSignOut,
  onSyncLocalBest,
  onSendYuzuGift,
  onClaimYuzuGift,
}: LeaderboardPanelProps) {
  const [selectedRecipient, setSelectedRecipient] = useState<GlobalLeaderboardEntry | null>(null);
  const [giftMessage, setGiftMessage] = useState('Chúc bạn vượt suối vui vẻ!');
  const [sendingGift, setSendingGift] = useState(false);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [giftFeedback, setGiftFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const canSyncBest =
    Boolean(user) && localBestScore > 0 && localBestScore > (personalEntry?.score ?? -1);

  const handleOpenGiftModal = (entry: GlobalLeaderboardEntry) => {
    setGiftFeedback(null);
    setSelectedRecipient(entry);
  };

  const handleConfirmSendGift = async () => {
    if (!selectedRecipient || sendingGift) return;
    setSendingGift(true);
    setGiftFeedback(null);
    const res = await onSendYuzuGift(selectedRecipient, giftMessage);
    setSendingGift(false);
    if (res.ok) {
      setGiftFeedback({
        ok: true,
        text: `Đã gửi Gói quà quýt (+${YUZU_GIFT_AMOUNT} Quýt) tới ${selectedRecipient.playerName}!`,
      });
    } else {
      setGiftFeedback({
        ok: false,
        text: res.error || 'Không thể gửi Gói quà quýt lúc này. Hãy thử lại sau.',
      });
    }
  };

  const handleClaim = async (gift: YuzuGift) => {
    if (claimingId) return;
    setClaimingId(gift.id);
    try {
      await onClaimYuzuGift(gift);
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <section
      aria-labelledby="leaderboard-heading"
      className="mt-6 rounded-2xl border border-white/10 bg-[#16231D] p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-400" aria-hidden="true" />
            <h2 id="leaderboard-heading" className="font-display text-lg font-bold text-white">
              Bảng xếp hạng toàn cầu
            </h2>
          </div>
          <p className="mt-0.5 text-xs text-emerald-100/70">
            Top 10 điểm cao nhất · Nhấn vào tên người chơi để gửi Gói quà quýt (+{YUZU_GIFT_AMOUNT} Quýt, giới hạn 1 lần/ngày).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {user ? (
            <>
              <span className="text-xs text-emerald-100/85">
                Đang đăng nhập:{' '}
                <span className="font-semibold text-white">{user.displayName || user.email}</span>
              </span>

              {todaySentGift && (
                <span className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-amber-400/25 bg-amber-500/10 px-3 text-xs font-medium text-amber-200">
                  <Gift className="h-3.5 w-3.5 text-amber-300" aria-hidden="true" />
                  <span>Đã tặng quà hôm nay cho {todaySentGift.recipientName}</span>
                </span>
              )}

              {canSyncBest && (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={onSyncLocalBest}
                  className="inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-lg bg-amber-500 px-3.5 text-xs font-bold text-[#1A1308] transition-colors hover:bg-amber-400 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                >
                  <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>
                    {submitting
                      ? 'Đang lưu...'
                      : `Lưu kỷ lục (${localBestScore.toLocaleString('vi-VN')})`}
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={onSignOut}
                className="inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-lg border border-white/12 bg-[#21332A] px-3.5 text-xs font-semibold text-emerald-100 transition-colors hover:bg-[#2B4236] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Đăng xuất</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={authBusy}
              onClick={onSignIn}
              className="inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-lg bg-amber-500 px-4 text-xs font-bold text-[#1A1308] transition-colors hover:bg-amber-400 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
            >
              <LogIn className="h-4 w-4" aria-hidden="true" />
              <span>{authBusy ? 'Đang kết nối...' : 'Đăng nhập Google để ghi danh'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Incoming Unclaimed Yuzu Gift Packs Inbox */}
      {user && incomingGifts.length > 0 && (
        <div className="mt-4 rounded-xl border border-amber-400/35 bg-[#1B2B22] p-3.5">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
            <Gift className="h-4 w-4" aria-hidden="true" />
            <span>Hộp quà quýt từ bạn bè ({incomingGifts.length} gói chưa nhận)</span>
          </div>
          <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {incomingGifts.map((gift) => (
              <div
                key={gift.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-[#121D18] px-3 py-2.5"
              >
                <div className="min-w-0">
                  <div className="truncate text-xs font-bold text-white">
                    Từ {gift.senderName} ·{' '}
                    <span className="font-mono-num text-amber-300">+{gift.yuzuAmount} Quýt</span>
                  </div>
                  {gift.message && (
                    <p className="mt-0.5 truncate text-[11px] text-emerald-100/75">
                      "{gift.message}"
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  disabled={claimingId === gift.id}
                  onClick={() => void handleClaim(gift)}
                  className="inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg bg-amber-500 px-3 text-xs font-bold text-[#1A1308] transition-colors hover:bg-amber-400 disabled:opacity-60"
                >
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{claimingId === gift.id ? 'Đang nhận...' : `Nhận +${gift.yuzuAmount} Quýt`}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Player Gift Panel */}
      {selectedRecipient && (
        <div
          role="dialog"
          aria-label={`Gửi Gói quà quýt cho ${selectedRecipient.playerName}`}
          className="mt-4 rounded-xl border border-amber-400/40 bg-[#121D18] p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-amber-400/40 bg-amber-500/15 text-amber-300">
                <Gift className="h-4 w-4" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-display text-sm font-bold text-white">
                  Gửi Gói quà quýt cho {selectedRecipient.playerName}
                </h3>
                <p className="text-[11px] text-emerald-100/75">
                  Quà tặng miễn phí từ hệ thống: <strong className="text-amber-300">+{YUZU_GIFT_AMOUNT} Quýt</strong> · Giới hạn 1 lần mỗi ngày.
                </p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Đóng khung gửi quà"
              onClick={() => setSelectedRecipient(null)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-[#1A2922] text-emerald-100 hover:text-white"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {!user ? (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3">
              <p className="text-xs text-emerald-100/80">
                Hãy đăng nhập tài khoản Google để gửi Gói quà quýt cho bạn bè trên bảng xếp hạng.
              </p>
              <button
                type="button"
                disabled={authBusy}
                onClick={onSignIn}
                className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg bg-amber-500 px-3.5 text-xs font-bold text-[#1A1308] hover:bg-amber-400"
              >
                <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Đăng nhập Google</span>
              </button>
            </div>
          ) : selectedRecipient.uid === user.uid ? (
            <p className="mt-3 border-t border-white/10 pt-3 text-xs text-emerald-100/75">
              Đây là hồ sơ của chính bạn! Hãy nhấn vào tên một người chơi khác để gửi Gói quà quýt mỗi ngày.
            </p>
          ) : todaySentGift ? (
            <div className="mt-3 border-t border-white/10 pt-3 text-xs text-amber-200">
              {giftFeedback?.ok ? (
                <span className="font-semibold text-emerald-300">{giftFeedback.text}</span>
              ) : (
                <span>
                  Hôm nay bạn đã gửi Gói quà quýt cho{' '}
                  <strong className="text-white">{todaySentGift.recipientName}</strong>. Hẹn bạn quay lại vào ngày mai!
                </span>
              )}
            </div>
          ) : (
            <div className="mt-3 space-y-2.5 border-t border-white/10 pt-3">
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  maxLength={60}
                  value={giftMessage}
                  onChange={(e) => setGiftMessage(e.target.value)}
                  placeholder="Lời chúc ngắn gửi kèm gói quà (tối đa 60 ký tự)..."
                  className="h-10 flex-1 rounded-lg border border-white/15 bg-[#0C1410] px-3 text-xs text-white placeholder:text-white/35 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
                <button
                  type="button"
                  disabled={sendingGift}
                  onClick={() => void handleConfirmSendGift()}
                  className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-amber-500 px-4 text-xs font-bold text-[#1A1308] transition-colors hover:bg-amber-400 disabled:opacity-60"
                >
                  <Send className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{sendingGift ? 'Đang gửi...' : `Gửi Gói quà (+${YUZU_GIFT_AMOUNT} Quýt)`}</span>
                </button>
              </div>
              {giftFeedback && (
                <p
                  className={`text-xs font-medium ${
                    giftFeedback.ok ? 'text-emerald-300' : 'text-rose-300'
                  }`}
                >
                  {giftFeedback.text}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="mt-4">
        {loading ? (
          <div className="py-8 text-center text-sm text-emerald-100/70">
            Đang tải bảng xếp hạng toàn cầu...
          </div>
        ) : errorMessage ? (
          <div className="rounded-xl border border-rose-400/25 bg-rose-950/25 p-4 text-sm text-rose-200">
            {errorMessage}
          </div>
        ) : entries.length === 0 ? (
          <div className="py-8 text-center text-sm text-emerald-100/70">
            Chưa có kỷ lục nào trên bảng xếp hạng. Hãy đăng nhập Google và hoàn thành một lượt chạy để dẫn đầu!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs font-medium text-emerald-200/70">
                  <th className="py-2.5 pr-3">Hạng</th>
                  <th className="py-2.5 pr-4">Người chơi (Nhấn để tặng quà)</th>
                  <th className="py-2.5 pr-4">Nhịp độ</th>
                  <th className="py-2.5 pr-4 text-right">Quãng đường</th>
                  <th className="py-2.5 text-right">Điểm cao nhất</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/8">
                {entries.map((entry, idx) => {
                  const rank = idx + 1;
                  const isMe = user?.uid === entry.uid;
                  const isSelected = selectedRecipient?.uid === entry.uid;
                  const furSwatch =
                    FUR_OPTIONS.find((f) => f.id === entry.fur)?.swatchColor ?? '#9C6B43';
                  const diffLabel =
                    DIFFICULTY_CONFIGS[entry.difficulty]?.label ?? 'Bình thường';

                  return (
                    <tr
                      key={entry.uid}
                      className={
                        isSelected
                          ? 'bg-amber-500/15'
                          : isMe
                          ? 'bg-amber-500/10'
                          : 'hover:bg-white/[0.03]'
                      }
                    >
                      <td className="font-mono-num py-3 pr-3 font-bold">
                        <span
                          className={
                            rank === 1
                              ? 'text-amber-300'
                              : rank === 2
                              ? 'text-slate-200'
                              : rank === 3
                              ? 'text-orange-300'
                              : 'text-emerald-200/70'
                          }
                        >
                          #{rank}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="h-3.5 w-3.5 shrink-0 rounded-sm border border-white/20"
                            style={{ backgroundColor: furSwatch }}
                            aria-hidden="true"
                          />
                          <button
                            type="button"
                            onClick={() => handleOpenGiftModal(entry)}
                            className="group inline-flex items-center gap-1.5 text-left font-semibold text-white transition-colors hover:text-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                            title={
                              isMe
                                ? 'Hồ sơ của bạn'
                                : `Nhấn để gửi Gói quà quýt cho ${entry.playerName}`
                            }
                          >
                            <span className="underline decoration-white/20 underline-offset-4 group-hover:decoration-amber-300">
                              {entry.playerName}
                            </span>
                            {!isMe && (
                              <Gift
                                className="h-3.5 w-3.5 shrink-0 text-amber-300/75 transition-transform group-hover:scale-110 group-hover:text-amber-300"
                                aria-hidden="true"
                              />
                            )}
                          </button>
                          {isMe && (
                            <span className="text-xs font-medium text-amber-300">(Bạn)</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-xs text-emerald-100/75">{diffLabel}</td>
                      <td className="font-mono-num py-3 pr-4 text-right text-emerald-100/80">
                        {entry.distanceMeters.toLocaleString('vi-VN')}m
                      </td>
                      <td className="font-mono-num py-3 text-right font-bold text-amber-300">
                        {entry.score.toLocaleString('vi-VN')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {user && personalEntry && !entries.some((e) => e.uid === user.uid) && (
          <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-xs text-emerald-100/85">
            <span>
              Kỷ lục của bạn trên hệ thống:{' '}
              <strong className="text-white">{personalEntry.playerName}</strong>
            </span>
            <span className="font-mono-num font-bold text-amber-300">
              {personalEntry.score.toLocaleString('vi-VN')} điểm
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
