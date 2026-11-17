/**
 * عقود بيانات المكتبة العامة (Public Library Contracts)
 * ======================================================
 * أشكال استجابات /api/library/* كما تستهلكها واجهة القرّاء —
 * مرجع واحد يضمن تطابق الطرفين دون تكرار التعريفات.
 */

/** تصنيف كما يُعرض في المكتبة العامة */
export interface LibraryCategory {
  id: string;
  title: string;
  icon: string | null;
  order: number;
  bookCount: number;
}

/** كتاب كما يُعرض في شبكة المكتبة */
export interface LibraryBook {
  id: string;
  title: string;
  author: string | null;
  description: string | null;
  categoryTitle: string | null;
  chapterCount: number;
  reviewCount: number;
  order: number;
}

/** استجابة GET /api/library */
export interface LibraryHomeResponse {
  ok: boolean;
  categories: LibraryCategory[];
  books: LibraryBook[];
}

/** فصل كتاب مع محتوى القراءة */
export interface LibraryChapter {
  id: string;
  title: string;
  order: number;
  content: string | null;
}

/** مراجعة معتمدة كما يقرؤها الجميع */
export interface LibraryReview {
  id: string;
  author: string;
  rating: number;
  comment: string;
  createdAt: string;
}

/** تفاصيل كتاب — GET /api/library/books/:id */
export interface LibraryBookDetail {
  id: string;
  title: string;
  author: string | null;
  description: string | null;
  categoryTitle: string | null;
  chapters: LibraryChapter[];
  reviews: LibraryReview[];
}

/** استجابة تفاصيل الكتاب */
export interface LibraryBookResponse {
  ok: boolean;
  book?: LibraryBookDetail;
}
