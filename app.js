/**
 * 실제 검수 시작
 */
function startOrderCheck() {
  if (
    !uploadedData.purchase ||
    !uploadedData.online ||
    !uploadedData.direct
  ) {
    setStatus(
      'error',
      '파일 3개를 모두 업로드해 주세요.'
    );

    return;
  }

  const startButton =
    document.getElementById(
      'startCheckButton'
    );

  if (startButton) {
    startButton.disabled = true;
    startButton.textContent =
      '검수 중...';
  }

  setStatus(
    'loading',
    '발주서·온라인·직배 데이터를 비교하고 있습니다.'
  );

  try {
    /*
     * 화면이 먼저 검수 중 상태로 바뀐 뒤
     * 비교 작업을 시작합니다.
     */
    window.setTimeout(
      () => {
        try {
          checkResults =
            runOrderCheckEngine();

          activeResultFilter =
            'all';

          resetResultFilterButtons();

          updateResultKpis();

          renderCheckResults();

          const resultSection =
            document.getElementById(
              'resultSection'
            );

          if (resultSection) {
            resultSection.hidden =
              false;

            resultSection
              .scrollIntoView({
                behavior: 'smooth',
                block: 'start'
              });
          }

          const summary =
            calculateCheckSummary();

          setStatus(
            summary.errorCount === 0
              ? 'success'
              : 'warning',
            '검수 완료 · 정상 ' +
              formatNumber(
                summary.normalCount
              ) +
              '건 · 오류 ' +
              formatNumber(
                summary.errorCount
              ) +
              '건'
          );

        } catch (error) {
          console.error(error);

          setStatus(
            'error',
            '검수 중 오류가 발생했습니다: ' +
              error.message
          );
        } finally {
          if (startButton) {
            startButton.disabled =
              false;

            startButton.textContent =
              '검수 다시 실행';
          }
        }
      },
      50
    );

  } catch (error) {
    console.error(error);

    setStatus(
      'error',
      '검수를 시작하지 못했습니다: ' +
        error.message
    );

    if (startButton) {
      startButton.disabled = false;
      startButton.textContent =
        '검수 시작';
    }
  }
}
