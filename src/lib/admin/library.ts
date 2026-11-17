/**
 * أدوات مكتبة لوحة الإدارة (Library Helpers)
 * ============================================
 * تشكيل موحّد لصفوف الكتب والتصنيفات وفصول الكتب كما تراها
 * الواجهة — حتى يبقى شكل الاستجابة ثابتاً مهما تغيّر الاستعلام.
 */

import type { Book, BookCategory, BookChapter } from "@prisma/client";

/** كتاب مع فئته وعدد فصوله — كما يُعرض في القوائم */
export interface ShapedBook {
  id: string;
  title: string;
  author: string | null;
  description: string | null;
  status: string;
  categoryId: string | null;
  categoryTitle: string | null;
  chapterCount: number;
  order: number;
}

/** تشكيل كتاب للعرض */
export function shapeBook(
  book: Book & { category: BookCategory | null },
  chapterCount: number,
): ShapedBook {
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    description: book.description,
    status: book.status,
    categoryId: book.categoryId,
    categoryTitle: book.category?.title ?? null,
    chapterCount,
    order: book.order,
  };
}

/** فصل كتاب مع عنوان كتابه — كما يُعرض في القوائم */
export interface ShapedBookChapter {
  id: string;
  bookId: string;
  bookTitle: string | null;
  title: string;
  order: number;
  /** نص الفصل للقراءة — null يعني بلا محتوى بعد */
  content: string | null;
}

/** تشكيل فصل كتاب للعرض */
export function shapeBookChapter(
  chapter: BookChapter & { book: { title: string } | null },
): ShapedBookChapter {
  return {
    id: chapter.id,
    bookId: chapter.bookId,
    bookTitle: chapter.book?.title ?? null,
    title: chapter.title,
    order: chapter.order,
    content: chapter.content,
  };
}

/** الحالات المسموحة للكتاب */
export const BOOK_STATUSES = ["draft", "published"] as const;
