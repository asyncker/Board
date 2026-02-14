using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Board.MessageService.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddDatetimeIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Messages_GroupId",
                table: "Messages");

            migrationBuilder.CreateIndex(
                name: "IX_Messages_GroupId_CreatedUtcAt",
                table: "Messages",
                columns: new[] { "GroupId", "CreatedUtcAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Messages_GroupId_CreatedUtcAt",
                table: "Messages");

            migrationBuilder.CreateIndex(
                name: "IX_Messages_GroupId",
                table: "Messages",
                column: "GroupId");
        }
    }
}
