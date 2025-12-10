<?php

namespace App\Controller;

use App\Model\Book;
use App\Repository\BookRepository;
use App\Service\Templating;
use App\Service\Router;

class BookController
{
    // Lokalizacja plików szablonów dla tej encji
    private const BOOKS_VIEWS_DIR = 'books';

    /**
     * @return string
     */
    public function indexAction(Templating $templating, Router $router): string
    {
        $books = $repository->findAll();

        $html = $templating->render(self::BOOKS_VIEWS_DIR . DIRECTORY_SEPARATOR . 'books-index.html.php', [
            'books' => $books,
            'router' => $router,
        ]);
        return $html;
    }

    /**
     * @param int $id
     * @param Templating $templating
     * @param Router $router
     * @return string
     */
    public function showAction(int $id, Templating $templating, Router $router): string
    {
        $book = $repository->find($id);

        if (!$book) {
            return 'Book not found'; // Lub obsługa błędu 404
        }

        $html = $templating->render(self::BOOKS_VIEWS_DIR . DIRECTORY_SEPARATOR . 'books-show.html.php', [
            'book' => $book,
            'router' => $router,
        ]);
        return $html;
    }

    /**
     * @param array|null $bookData
     * @param Templating $templating
     * @param Router $router
     * @return string
     */
    public function createAction(?array $bookData, Templating $templating, Router $router): string
    {
        $book = new Book();

        if ($bookData) {
            $book->setTitle($bookData['title']);
            $book->setAuthor($bookData['author']);

            // W tym miejscu powinna być walidacja danych

            $repository->save($book);

            // Po zapisie przekierowanie do listy
            header('Location: ' . $router->generatePath('books-index'));
            exit();
        }

        $html = $templating->render(self::BOOKS_VIEWS_DIR . DIRECTORY_SEPARATOR . 'books-create.html.php', [
            'book' => $book, // Przekazanie pustego/domyślnego obiektu do formularza
            'router' => $router,
        ]);
        return $html;
    }

    /**
     * @param int $id
     * @param array|null $bookData
     * @param Templating $templating
     * @param Router $router
     * @return string
     */
    public function editAction(int $id, ?array $bookData, Templating $templating, Router $router): string
    {
        $book = $repository->find($id);

        if (!$book) {
            return 'Book not found';
        }

        if ($bookData) {
            $book->setTitle($bookData['title']);
            $book->setAuthor($bookData['author']);

            // W tym miejscu powinna być walidacja danych

            $repository->update($book);

            // Po zapisie przekierowanie do widoku edycji (zobaczenia zmian)
            header('Location: ' . $router->generatePath('books-edit', ['id' => $book->getId()]));
            exit();
        }

        $html = $templating->render(self::BOOKS_VIEWS_DIR . DIRECTORY_SEPARATOR . 'books-edit.html.php', [
            'book' => $book,
            'router' => $router,
        ]);
        return $html;
    }

    /**
     * @param int $id
     * @param Router $router
     */
    public function deleteAction(int $id, Router $router)
    {
        $repository->delete($id);

        // Po usunięciu przekierowanie do listy
        header('Location: ' . $router->generatePath('books-index'));
        exit();
    }
}