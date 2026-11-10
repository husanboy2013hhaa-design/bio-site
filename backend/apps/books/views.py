from django.http import Http404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Book
from .serializers import BookSerializer


def owned_book_or_404(user, pk):
    try:
        return Book.objects.get(pk=pk, profile=user.profile)
    except Book.DoesNotExist:
        raise Http404


class BookListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = request.user.profile.books.all()
        return Response(BookSerializer(qs, many=True).data)

    def post(self, request):
        serializer = BookSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        profile = request.user.profile
        last = profile.books.order_by("-position").values_list("position", flat=True).first()
        book = serializer.save(profile=profile, position=(last or 0) + 1)
        return Response(BookSerializer(book).data, status=status.HTTP_201_CREATED)


class BookDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        book = owned_book_or_404(request.user, pk)
        serializer = BookSerializer(book, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        book = owned_book_or_404(request.user, pk)
        book.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
